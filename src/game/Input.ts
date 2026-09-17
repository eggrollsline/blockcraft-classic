export class Input {
  private keys = new Set<string>();
  jumpQueued = false;
  constructor() {
    addEventListener('keydown', (event) => {
      if (!event.repeat && event.code === 'Space') this.jumpQueued = true;
      this.keys.add(event.code);
    });
    addEventListener('keyup', (event) => this.keys.delete(event.code));
    addEventListener('blur', () => this.keys.clear());
  }
  down(code: string): boolean { return this.keys.has(code); }
  consumeJump(): boolean { const value = this.jumpQueued; this.jumpQueued = false; return value; }
}
