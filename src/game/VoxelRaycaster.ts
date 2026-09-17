import * as THREE from 'three';
import { BlockType } from './BlockTypes';
import { World } from './World';

export interface VoxelHit { block: THREE.Vector3; normal: THREE.Vector3; distance: number }

export function raycastVoxels(world: World, origin: THREE.Vector3, direction: THREE.Vector3, maxDistance = 6): VoxelHit | null {
  const pos = origin.clone();
  let x = Math.floor(pos.x), y = Math.floor(pos.y), z = Math.floor(pos.z);
  const stepX = direction.x >= 0 ? 1 : -1, stepY = direction.y >= 0 ? 1 : -1, stepZ = direction.z >= 0 ? 1 : -1;
  const deltaX = direction.x === 0 ? Infinity : Math.abs(1 / direction.x);
  const deltaY = direction.y === 0 ? Infinity : Math.abs(1 / direction.y);
  const deltaZ = direction.z === 0 ? Infinity : Math.abs(1 / direction.z);
  let maxX = direction.x === 0 ? Infinity : ((direction.x >= 0 ? x + 1 : x) - pos.x) / direction.x;
  let maxY = direction.y === 0 ? Infinity : ((direction.y >= 0 ? y + 1 : y) - pos.y) / direction.y;
  let maxZ = direction.z === 0 ? Infinity : ((direction.z >= 0 ? z + 1 : z) - pos.z) / direction.z;
  const normal = new THREE.Vector3();
  let distance = 0;
  while (distance <= maxDistance) {
    const block = world.getBlock(x, y, z);
    if (block !== BlockType.Air && block !== BlockType.Water) return { block: new THREE.Vector3(x, y, z), normal: normal.clone(), distance };
    if (maxX < maxY && maxX < maxZ) { x += stepX; distance = maxX; maxX += deltaX; normal.set(-stepX, 0, 0); }
    else if (maxY < maxZ) { y += stepY; distance = maxY; maxY += deltaY; normal.set(0, -stepY, 0); }
    else { z += stepZ; distance = maxZ; maxZ += deltaZ; normal.set(0, 0, -stepZ); }
  }
  return null;
}
