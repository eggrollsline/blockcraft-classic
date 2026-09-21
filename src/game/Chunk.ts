import * as THREE from 'three';
import { BLOCKS, BlockType, CHUNK_SIZE, WORLD_HEIGHT } from './BlockTypes';

export interface BlockSource { getBlock(x: number, y: number, z: number): BlockType }

const FACES = [
  { d: [1, 0, 0], n: [1, 0, 0], c: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { d: [-1, 0, 0], n: [-1, 0, 0], c: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { d: [0, 1, 0], n: [0, 1, 0], c: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { d: [0, -1, 0], n: [0, -1, 0], c: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { d: [0, 0, 1], n: [0, 0, 1], c: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
  { d: [0, 0, -1], n: [0, 0, -1], c: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] },
] as const;

const makeGeometry = (world: BlockSource, cx: number, cz: number, water: boolean): THREE.BufferGeometry => {
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], colors: number[] = [], indices: number[] = [];
  const ox = cx * CHUNK_SIZE, oz = cz * CHUNK_SIZE;
  for (let lx = 0; lx < CHUNK_SIZE; lx++) for (let z = 0; z < CHUNK_SIZE; z++) for (let y = 0; y < WORLD_HEIGHT; y++) {
    const x = ox + lx, wz = oz + z, type = world.getBlock(x, y, wz);
    if ((type === BlockType.Water) !== water || type === BlockType.Air) continue;
    for (let f = 0; f < FACES.length; f++) {
      const face = FACES[f];
      const neighbor = world.getBlock(x + face.d[0], y + face.d[1], wz + face.d[2]);
      const show = water ? neighbor === BlockType.Air : BLOCKS[neighbor].transparent;
      if (!show) continue;
      const base = positions.length / 3;
      const shade = f === 2 ? 1 : f === 3 ? 0.58 : f < 2 ? 0.78 : 0.88;
      for (const corner of face.c) {
        positions.push(x + corner[0], y + corner[1], wz + corner[2]);
        normals.push(...face.n);
        colors.push(shade, shade, shade);
      }
      const atlasIndex = BLOCKS[type].atlas[f === 2 ? 0 : f === 3 ? 2 : 1];
      const tileCount = 11, pad = 0.002;
      const u0 = atlasIndex / tileCount + pad, u1 = (atlasIndex + 1) / tileCount - pad;
      uvs.push(u1, pad, u1, 1 - pad, u0, 1 - pad, u0, pad);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
};

export class Chunk {
  readonly group = new THREE.Group();
  constructor(readonly cx: number, readonly cz: number, private world: BlockSource, private solidMaterial: THREE.Material, private waterMaterial: THREE.Material) {
    this.rebuild();
  }

  rebuild(): void {
    this.disposeMeshes();
    const solid = new THREE.Mesh(makeGeometry(this.world, this.cx, this.cz, false), this.solidMaterial);
    const water = new THREE.Mesh(makeGeometry(this.world, this.cx, this.cz, true), this.waterMaterial);
    solid.name = 'terrain'; water.name = 'water';
    solid.castShadow = false; solid.receiveShadow = true;
    water.renderOrder = 2;
    this.group.add(solid, water);
  }

  dispose(): void { this.disposeMeshes(); this.group.removeFromParent(); }
  private disposeMeshes(): void {
    for (const child of [...this.group.children]) {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
      this.group.remove(child);
    }
  }
}

export function createTextureAtlas(): THREE.CanvasTexture {
  const size = 16, canvas = document.createElement('canvas');
  canvas.width = size * 11; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const palettes = [
    ['#6fa43c','#82b84a','#527e32'], ['#57913b','#6d4c2c','#47772f'], ['#805933','#986a3c','#684324'],
    ['#85898b','#9ba0a1','#676d70'], ['#d9c67c','#ead894','#bca65f'], ['#916334','#b18148','#68431f'],
    ['#9a713c','#b88c50','#6b4728'], ['#3f7e38','#589749','#28612e'], ['#a85243','#c16853','#74362f'],
    ['#b98549','#d0a15f','#936130'], ['#398bc2','#59a6d1','#2673ae'],
  ];
  palettes.forEach((palette, index) => {
    ctx.fillStyle = palette[0]; ctx.fillRect(index * size, 0, size, size);
    let state = (index + 17) * 997;
    for (let i = 0; i < 46; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const x = state % size; state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const y = state % size; ctx.fillStyle = palette[1 + (state % 2)]; ctx.fillRect(index * size + x, y, index === 8 ? 3 : 1, 1);
    }
    if (index === 8) { ctx.fillStyle = '#e2a08b'; for (let y=3;y<16;y+=5) ctx.fillRect(index*size,y,16,1); }
    if (index === 9) { ctx.fillStyle = '#704923'; for (let y=4;y<16;y+=5) ctx.fillRect(index*size,y,16,1); }
    if (index === 6) { ctx.strokeStyle='#68431f'; ctx.strokeRect(index*size+3,3,10,10); ctx.strokeRect(index*size+6,6,4,4); }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
