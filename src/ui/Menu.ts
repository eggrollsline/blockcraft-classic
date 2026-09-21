export type DistanceChoice = 2 | 3 | 5;
export interface MenuActions { play(): void; newWorld(): void; reset(): void; distance(value: DistanceChoice): void }

export class Menu {
  readonly root: HTMLElement;
  private title: HTMLElement; private pauseTitle: HTMLElement; private seedText: HTMLElement;
  constructor(parent: HTMLElement, private actions: MenuActions) {
    this.root = document.createElement('main'); this.root.className = 'menu title-screen';
    this.root.innerHTML = `
      <section class="menu-card">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <p class="eyebrow">A TINY WORLD OF YOUR OWN</p>
        <h1>BLOCKCRAFT<br><strong>CLASSIC</strong></h1>
        <h2 class="pause-title">Paused</h2>
        <p class="tagline">Explore rolling worlds. Build anything.</p>
        <div class="primary-actions"><button data-action="play">Play World</button><button class="secondary" data-action="new">New World</button></div>
        <section class="pause-options">
          <p class="seed-text"></p>
          <h3>Render distance</h3>
          <div class="distance"><button data-distance="2">Near</button><button data-distance="3">Medium</button><button data-distance="5">Far</button></div>
          <button class="danger" data-action="reset">Reset Saved World</button>
        </section>
        <div class="controls"><b>CONTROLS</b><span><kbd>WASD</kbd> Move</span><span><kbd>Mouse</kbd> Look</span><span><kbd>Space</kbd> Jump</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>L / R Click</kbd> Break / Place</span><span><kbd>1–8</kbd> Blocks</span><span><kbd>R</kbd> Respawn</span><span><kbd>F</kbd> Stats</span></div>
        <footer>An original voxel sandbox game. Not affiliated with or endorsed by Mojang or Microsoft.</footer>
      </section>`;
    parent.append(this.root);
    this.title = this.root.querySelector('h1')!; this.pauseTitle = this.root.querySelector('.pause-title')!; this.seedText = this.root.querySelector('.seed-text')!;
    this.root.querySelector('[data-action="play"]')!.addEventListener('click', actions.play);
    this.root.querySelector('[data-action="new"]')!.addEventListener('click', actions.newWorld);
    this.root.querySelector('[data-action="reset"]')!.addEventListener('click', actions.reset);
    this.root.querySelectorAll<HTMLElement>('[data-distance]').forEach((button) => button.addEventListener('click', () => actions.distance(Number(button.dataset.distance) as DistanceChoice)));
  }
  showTitle(): void { this.root.classList.remove('hidden', 'pause'); this.root.classList.add('title-screen'); this.title.hidden = false; this.pauseTitle.hidden = true; }
  showPause(seed: number, distance: number): void {
    this.root.classList.remove('hidden', 'title-screen'); this.root.classList.add('pause'); this.title.hidden = true; this.pauseTitle.hidden = false;
    this.seedText.textContent = `World seed · ${seed}`;
    this.root.querySelectorAll<HTMLElement>('[data-distance]').forEach((b) => b.classList.toggle('active', Number(b.dataset.distance) === distance));
    (this.root.querySelector('[data-action="play"]') as HTMLButtonElement).textContent = 'Resume';
  }
  hide(): void { this.root.classList.add('hidden'); }
}
