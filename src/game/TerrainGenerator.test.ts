import { describe, expect, it } from 'vitest';
import { BlockType, SEA_LEVEL } from './BlockTypes';
import { TerrainGenerator } from './TerrainGenerator';

describe('TerrainGenerator', () => {
  it('is deterministic and creates layered terrain', () => {
    const a = new TerrainGenerator(12345);
    const b = new TerrainGenerator(12345);
    for (let x = -12; x <= 12; x += 4) for (let z = -12; z <= 12; z += 4) {
      expect(a.heightAt(x, z)).toBe(b.heightAt(x, z));
      const height = a.heightAt(x, z);
      expect(a.blockAt(x, height, z)).not.toBe(BlockType.Air);
      expect(a.blockAt(x, Math.max(0, height - 5), z)).toBe(BlockType.Stone);
    }
  });

  it('produces varied coherent heights and a safe spawn', () => {
    const terrain = new TerrainGenerator(987654321);
    const heights = Array.from({ length: 30 }, (_, i) => terrain.heightAt(i, i));
    expect(new Set(heights).size).toBeGreaterThan(2);
    const spawn = terrain.safeSpawn();
    expect(spawn.y).toBeGreaterThan(SEA_LEVEL);
    expect(terrain.blockAt(Math.floor(spawn.x), Math.floor(spawn.y), Math.floor(spawn.z))).toBe(BlockType.Air);
  });
});
