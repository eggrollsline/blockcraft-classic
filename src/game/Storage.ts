import { BlockType } from './BlockTypes';

export interface SavedPlayer { x: number; y: number; z: number; yaw: number; pitch: number }
export interface SavedWorld {
  version: 1;
  seed: number;
  player?: SavedPlayer;
  distance: number;
  edits: Record<string, BlockType>;
}

const KEY = 'blockcraft-classic-world-v1';
const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;

export class Storage {
  static load(): SavedWorld {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedWorld;
        if (parsed.version === 1 && Number.isFinite(parsed.seed) && parsed.edits) return parsed;
      }
    } catch { /* Corrupt storage falls back to a fresh world. */ }
    return { version: 1, seed: randomSeed(), distance: 3, edits: {} };
  }

  static save(world: SavedWorld): void {
    localStorage.setItem(KEY, JSON.stringify(world));
  }

  static fresh(distance: number): SavedWorld {
    const world: SavedWorld = { version: 1, seed: randomSeed(), distance, edits: {} };
    this.save(world);
    return world;
  }

  static clear(): void { localStorage.removeItem(KEY); }
}
