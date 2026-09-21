import * as THREE from 'three';
import { BlockType, HOTBAR } from './BlockTypes';
import { Input } from './Input';
import { Player } from './Player';
import { SavedWorld, Storage } from './Storage';
import { raycastVoxels, VoxelHit } from './VoxelRaycaster';
import { World } from './World';
import { Hud } from '../ui/Hud';
import { DistanceChoice, Menu } from '../ui/Menu';

export class Game {
  private renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 180);
  private input = new Input();
  private saved: SavedWorld = Storage.load();
  private world = new World(this.saved);
  private player = new Player(this.camera, this.world, this.saved.player);
  private hud: Hud;
  private menu: Menu;
  private outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.012, 1.012, 1.012)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 }));
  private hit: VoxelHit | null = null;
  private started = false;
  private lastTime = performance.now();
  private frames = 0; private fps = 0; private fpsTime = 0; private saveTime = 0;
  private audio?: AudioContext;

  constructor(private root: HTMLElement) {
    root.append(this.renderer.domElement); this.renderer.domElement.id = 'game-canvas';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.setSize(innerWidth, innerHeight);
    this.scene.background = new THREE.Color(0x76b9dc); this.scene.fog = new THREE.Fog(0x9cc6d5, 35, 72);
    this.scene.add(this.world.group, new THREE.HemisphereLight(0xcce8ff, 0x526744, 1.65));
    const sun = new THREE.DirectionalLight(0xfff2cf, 1.8); sun.position.set(-35, 60, 25); this.scene.add(sun);
    this.outline.visible = false; this.scene.add(this.outline);
    this.hud = new Hud(root);
    this.menu = new Menu(root, { play: () => this.play(), newWorld: () => this.newWorld(), reset: () => this.resetWorld(), distance: (d) => this.setDistance(d) });
    this.menu.showTitle();
    this.bindEvents(); this.applyDistance();
    requestAnimationFrame((time) => this.loop(time));
  }

  private bindEvents(): void {
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); });
    addEventListener('mousemove', (e) => { if (document.pointerLockElement === this.renderer.domElement) this.player.look(e.movementX, e.movementY); });
    addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.renderer.domElement;
      this.hud.show(locked);
      if (locked) this.menu.hide(); else if (this.started) this.menu.showPause(this.saved.seed, this.saved.distance);
    });
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== this.renderer.domElement || !this.hit) return;
      if (e.button === 0) this.breakBlock(); else if (e.button === 2) this.placeBlock();
    });
    addEventListener('wheel', (e) => { if (this.started) this.hud.select(this.hud.selected + Math.sign(e.deltaY)); }, { passive: true });
    addEventListener('keydown', (e) => {
      if (/^Digit[1-8]$/.test(e.code)) this.hud.select(Number(e.code.slice(5)) - 1);
      if (!e.repeat && e.code === 'KeyR') this.player.respawn();
      if (!e.repeat && e.code === 'KeyF') this.hud.toggleDebug();
    });
    addEventListener('beforeunload', () => this.save());
  }

  private play(): void {
    this.started = true;
    this.renderer.domElement.requestPointerLock();
    if (!this.audio) this.audio = new AudioContext();
  }

  private newWorld(): void {
    if (!confirm('Create a new world? Your current terrain edits will be permanently cleared.')) return;
    this.saved = Storage.fresh(this.saved.distance); this.world.setSaved(this.saved); this.player.respawn(); this.applyDistance(); this.save();
    if (this.started) this.menu.showPause(this.saved.seed, this.saved.distance);
  }

  private resetWorld(): void {
    if (!confirm('Reset saved world? This removes all changes and creates a completely new world.')) return;
    Storage.clear(); this.saved = Storage.fresh(this.saved.distance); this.world.setSaved(this.saved); this.player.respawn(); this.applyDistance(); this.save();
    this.menu.showPause(this.saved.seed, this.saved.distance);
  }

  private setDistance(distance: DistanceChoice): void { this.saved.distance = distance; this.applyDistance(); this.save(); this.menu.showPause(this.saved.seed, distance); }
  private applyDistance(): void {
    const far = this.saved.distance * 16;
    this.scene.fog = new THREE.Fog(0x9cc6d5, Math.max(18, far * 0.52), far + 18);
    this.camera.far = far + 28; this.camera.updateProjectionMatrix();
    this.world.updateChunks(this.player.position.x, this.player.position.z, this.saved.distance, true);
  }

  private breakBlock(): void {
    if (!this.hit) return;
    const { x, y, z } = this.hit.block; if (this.world.getBlock(x, y, z) === BlockType.Water) return;
    this.world.setBlock(x, y, z, BlockType.Air); this.sound(150); this.save();
  }
  private placeBlock(): void {
    if (!this.hit) return;
    const pos = this.hit.block.clone().add(this.hit.normal); const { x, y, z } = pos;
    if (this.player.intersectsBlock(x, y, z)) return;
    this.world.setBlock(x, y, z, HOTBAR[this.hud.selected]); this.sound(260); this.save();
  }
  private sound(frequency: number): void {
    if (!this.audio) return;
    const oscillator = this.audio.createOscillator(), gain = this.audio.createGain();
    oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequency, this.audio.currentTime); oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, this.audio.currentTime + 0.055);
    gain.gain.setValueAtTime(0.035, this.audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.06);
    oscillator.connect(gain).connect(this.audio.destination); oscillator.start(); oscillator.stop(this.audio.currentTime + 0.065);
  }

  private loop(time: number): void {
    requestAnimationFrame((next) => this.loop(next));
    const dt = Math.min(0.05, (time - this.lastTime) / 1000); this.lastTime = time;
    const locked = document.pointerLockElement === this.renderer.domElement;
    if (locked) this.player.update(dt, this.input);
    this.world.updateChunks(this.player.position.x, this.player.position.z, this.saved.distance);
    const direction = new THREE.Vector3(); this.camera.getWorldDirection(direction);
    this.hit = locked ? raycastVoxels(this.world, this.camera.position, direction) : null;
    this.outline.visible = this.hit !== null;
    if (this.hit) this.outline.position.copy(this.hit.block).addScalar(0.5);
    this.frames++; this.fpsTime += dt; this.saveTime += dt;
    if (this.fpsTime >= 0.5) { this.fps = Math.round(this.frames / this.fpsTime); this.frames = 0; this.fpsTime = 0; }
    if (this.saveTime > 4) { this.save(); this.saveTime = 0; }
    this.hud.updateDebug(this.fps, this.player.position, (this.saved.distance * 2 + 1) ** 2, this.saved.seed);
    this.renderer.render(this.scene, this.camera);
  }
  private save(): void { this.saved.player = this.player.serialize(); Storage.save(this.saved); }
}
