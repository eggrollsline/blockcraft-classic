import { BlockType, SEA_LEVEL, WORLD_HEIGHT } from './BlockTypes';

const fade = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class TerrainGenerator {
  constructor(readonly seed: number) {}

  private hash(x: number, z: number, salt = 0): number {
    let n = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(this.seed + salt, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  private noise(x: number, z: number, scale: number, salt = 0): number {
    const sx = x / scale;
    const sz = z / scale;
    const ix = Math.floor(sx);
    const iz = Math.floor(sz);
    const fx = fade(sx - ix);
    const fz = fade(sz - iz);
    return lerp(lerp(this.hash(ix, iz, salt), this.hash(ix + 1, iz, salt), fx), lerp(this.hash(ix, iz + 1, salt), this.hash(ix + 1, iz + 1, salt), fx), fz);
  }

  heightAt(x: number, z: number): number {
    const broad = this.noise(x, z, 92, 11);
    const hills = this.noise(x, z, 38, 29);
    const detail = this.noise(x, z, 15, 47);
    const elevated = Math.max(0, this.noise(x, z, 160, 71) - 0.6) * 22;
    return Math.max(5, Math.min(WORLD_HEIGHT - 9, Math.floor(17 + broad * 10 + hills * 7 + detail * 3 + elevated)));
  }

  private hasTree(x: number, z: number): boolean {
    const h = this.heightAt(x, z);
    return h > SEA_LEVEL + 1 && this.hash(x, z, 991) > 0.985 && this.noise(x, z, 12, 83) > 0.42;
  }

  blockAt(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= WORLD_HEIGHT) return BlockType.Air;
    const surface = this.heightAt(x, z);
    if (y <= surface) {
      if (surface <= SEA_LEVEL + 1) return y >= surface - 3 ? BlockType.Sand : BlockType.Stone;
      if (y === surface) return BlockType.Grass;
      return y >= surface - 3 ? BlockType.Dirt : BlockType.Stone;
    }
    if (y <= SEA_LEVEL) return BlockType.Water;

    // Nearby tree anchors can contribute trunk or canopy to this column.
    for (let ax = x - 2; ax <= x + 2; ax++) {
      for (let az = z - 2; az <= z + 2; az++) {
        if (!this.hasTree(ax, az)) continue;
        const ground = this.heightAt(ax, az);
        const trunkTop = ground + 4 + (this.hash(ax, az, 119) > 0.5 ? 1 : 0);
        if (x === ax && z === az && y > ground && y <= trunkTop) return BlockType.Wood;
        const dx = Math.abs(x - ax);
        const dz = Math.abs(z - az);
        const dy = y - trunkTop;
        if (dy >= -2 && dy <= 1 && dx <= 2 && dz <= 2 && dx + dz + Math.max(0, dy) < 5) return BlockType.Leaves;
      }
    }
    return BlockType.Air;
  }

  safeSpawn(): { x: number; y: number; z: number } {
    for (let radius = 0; radius < 24; radius++) {
      for (let x = -radius; x <= radius; x++) {
        for (const z of [-radius, radius]) {
          const h = this.heightAt(x, z);
          if (h > SEA_LEVEL && h < SEA_LEVEL + 12 && this.blockAt(x, h + 1, z) === BlockType.Air) return { x: x + 0.5, y: h + 1.01, z: z + 0.5 };
        }
      }
    }
    return { x: 0.5, y: this.heightAt(0, 0) + 2, z: 0.5 };
  }
}
