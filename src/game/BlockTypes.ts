export enum BlockType {
  Air,
  Grass,
  Dirt,
  Stone,
  Sand,
  Wood,
  Leaves,
  Brick,
  Planks,
  Water,
}

export interface BlockDefinition {
  id: BlockType;
  name: string;
  solid: boolean;
  transparent: boolean;
  atlas: [number, number, number];
  swatch: [string, string, string];
}

export const BLOCKS: Record<BlockType, BlockDefinition> = {
  [BlockType.Air]: { id: BlockType.Air, name: 'Air', solid: false, transparent: true, atlas: [0, 0, 0], swatch: ['#000', '#000', '#000'] },
  [BlockType.Grass]: { id: BlockType.Grass, name: 'Grass Block', solid: true, transparent: false, atlas: [0, 1, 2], swatch: ['#77a943', '#60903a', '#76512d'] },
  [BlockType.Dirt]: { id: BlockType.Dirt, name: 'Dirt', solid: true, transparent: false, atlas: [2, 2, 2], swatch: ['#875e37', '#6e472a', '#a07142'] },
  [BlockType.Stone]: { id: BlockType.Stone, name: 'Stone', solid: true, transparent: false, atlas: [3, 3, 3], swatch: ['#85898b', '#6b7074', '#a0a4a4'] },
  [BlockType.Sand]: { id: BlockType.Sand, name: 'Sand', solid: true, transparent: false, atlas: [4, 4, 4], swatch: ['#d8c47b', '#c7ad62', '#ead891'] },
  [BlockType.Wood]: { id: BlockType.Wood, name: 'Oak Wood', solid: true, transparent: false, atlas: [5, 6, 5], swatch: ['#81572d', '#684320', '#a7793c'] },
  [BlockType.Leaves]: { id: BlockType.Leaves, name: 'Leaves', solid: true, transparent: false, atlas: [7, 7, 7], swatch: ['#3f7934', '#285c2f', '#5b9843'] },
  [BlockType.Brick]: { id: BlockType.Brick, name: 'Brick', solid: true, transparent: false, atlas: [8, 8, 8], swatch: ['#a34e3f', '#71372f', '#c1664e'] },
  [BlockType.Planks]: { id: BlockType.Planks, name: 'Wooden Planks', solid: true, transparent: false, atlas: [9, 9, 9], swatch: ['#b78345', '#936432', '#d1a363'] },
  [BlockType.Water]: { id: BlockType.Water, name: 'Water', solid: false, transparent: true, atlas: [10, 10, 10], swatch: ['#408cc0', '#2673aa', '#64add4'] },
};

export const HOTBAR = [BlockType.Grass, BlockType.Dirt, BlockType.Stone, BlockType.Sand, BlockType.Wood, BlockType.Leaves, BlockType.Brick, BlockType.Planks];
export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;
export const SEA_LEVEL = 24;

export const blockKey = (x: number, y: number, z: number): string => `${x},${y},${z}`;
