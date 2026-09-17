import { BLOCKS, HOTBAR } from '../game/BlockTypes';

export class Hud {
  readonly root: HTMLElement;
  private slots: HTMLElement[] = [];
  private name: HTMLElement;
  private debug: HTMLElement;
  selected = 0;
  debugVisible = false;
  constructor(parent: HTMLElement) {
    this.root = document.createElement('div'); this.root.className = 'hud hidden';
    this.root.innerHTML = '<div class="crosshair" aria-hidden="true"></div><div class="target-name"></div><div class="hotbar"></div><div class="debug"></div>';
    parent.append(this.root);
    this.name = this.root.querySelector('.target-name')!; this.debug = this.root.querySelector('.debug')!;
    const hotbar = this.root.querySelector('.hotbar')!;
    HOTBAR.forEach((block, i) => {
      const slot = document.createElement('div'); slot.className = 'hotbar-slot';
      const colors = BLOCKS[block].swatch;
      slot.innerHTML = `<span>${i + 1}</span><div class="block-icon" style="--top:${colors[0]};--side:${colors[1]};--front:${colors[2]}"></div>`;
      hotbar.append(slot); this.slots.push(slot);
    });
    this.select(0);
  }
  select(index: number): void {
    this.selected = (index + HOTBAR.length) % HOTBAR.length;
    this.slots.forEach((slot, i) => slot.classList.toggle('selected', i === this.selected));
    this.name.textContent = BLOCKS[HOTBAR[this.selected]].name;
  }
  show(value: boolean): void { this.root.classList.toggle('hidden', !value); }
  toggleDebug(): void { this.debugVisible = !this.debugVisible; this.debug.classList.toggle('visible', this.debugVisible); }
  updateDebug(fps: number, position: {x:number;y:number;z:number}, chunks: number, seed: number): void {
    this.debug.textContent = `${fps} FPS\nXYZ ${position.x.toFixed(1)} / ${position.y.toFixed(1)} / ${position.z.toFixed(1)}\nView ${chunks} chunks · Seed ${seed}`;
  }
}
