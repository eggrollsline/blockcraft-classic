import * as THREE from 'three';
import { BlockType, CHUNK_SIZE, blockKey } from './BlockTypes';
import { Chunk, createTextureAtlas } from './Chunk';
import { SavedWorld } from './Storage';
import { TerrainGenerator } from './TerrainGenerator';

const floorDiv = (n: number, d: number): number => Math.floor(n / d);

export class World {
  readonly group = new THREE.Group();
  generator: TerrainGenerator;
  private chunks = new Map<string, Chunk>();
  private atlas = createTextureAtlas();
  private solidMaterial = new THREE.MeshLambertMaterial({ map: this.atlas, vertexColors: true });
  private waterMaterial = new THREE.MeshLambertMaterial({ map: this.atlas, vertexColors: true, transparent: true, opacity: 0.68, depthWrite: false, side: THREE.DoubleSide });
  private lastCenter = '';

  constructor(private saved: SavedWorld) { this.generator = new TerrainGenerator(saved.seed); }

  getBlock(x: number, y: number, z: number): BlockType {
    const edit = this.saved.edits[blockKey(x, y, z)];
    return edit === undefined ? this.generator.blockAt(x, y, z) : edit;
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    const key = blockKey(x, y, z), original = this.generator.blockAt(x, y, z);
    if (type === original) delete this.saved.edits[key]; else this.saved.edits[key] = type;
    const cx = floorDiv(x, CHUNK_SIZE), cz = floorDiv(z, CHUNK_SIZE);
    this.rebuild(cx, cz);
    if (x - cx * CHUNK_SIZE === 0) this.rebuild(cx - 1, cz);
    if (x - cx * CHUNK_SIZE === CHUNK_SIZE - 1) this.rebuild(cx + 1, cz);
    if (z - cz * CHUNK_SIZE === 0) this.rebuild(cx, cz - 1);
    if (z - cz * CHUNK_SIZE === CHUNK_SIZE - 1) this.rebuild(cx, cz + 1);
  }

  updateChunks(x: number, z: number, distance: number, force = false): void {
    const centerX = floorDiv(x, CHUNK_SIZE), centerZ = floorDiv(z, CHUNK_SIZE);
    const token = `${centerX},${centerZ},${distance}`;
    if (!force && token === this.lastCenter) return;
    this.lastCenter = token;
    const wanted = new Set<string>();
    for (let dx = -distance; dx <= distance; dx++) for (let dz = -distance; dz <= distance; dz++) {
      if (dx * dx + dz * dz > (distance + 0.5) ** 2) continue;
      const cx = centerX + dx, cz = centerZ + dz, key = `${cx},${cz}`;
      wanted.add(key);
      if (!this.chunks.has(key)) {
        const chunk = new Chunk(cx, cz, this, this.solidMaterial, this.waterMaterial);
        this.chunks.set(key, chunk); this.group.add(chunk.group);
      }
    }
    for (const [key, chunk] of this.chunks) if (!wanted.has(key)) { chunk.dispose(); this.chunks.delete(key); }
  }

  setSaved(saved: SavedWorld): void {
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear(); this.saved = saved;
    this.generator = new TerrainGenerator(saved.seed);
    this.lastCenter = '';
  }

  private rebuild(cx: number, cz: number): void { this.chunks.get(`${cx},${cz}`)?.rebuild(); }
}
