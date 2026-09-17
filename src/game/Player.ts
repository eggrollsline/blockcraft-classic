import * as THREE from 'three';
import { BLOCKS } from './BlockTypes';
import { Input } from './Input';
import { SavedPlayer } from './Storage';
import { World } from './World';

const RADIUS = 0.3, HEIGHT = 1.75, EYE = 1.62;

export class Player {
  readonly position = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  yaw = 0; pitch = 0; grounded = false;
  constructor(readonly camera: THREE.PerspectiveCamera, private world: World, saved?: SavedPlayer) {
    if (saved) { this.position.set(saved.x, saved.y, saved.z); this.yaw = saved.yaw; this.pitch = saved.pitch; }
    else this.respawn();
    this.syncCamera();
  }

  update(dt: number, input: Input): void {
    const forward = Number(input.down('KeyW')) - Number(input.down('KeyS'));
    const strafe = Number(input.down('KeyD')) - Number(input.down('KeyA'));
    const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? 7.2 : 4.6;
    const length = Math.hypot(forward, strafe) || 1;
    this.velocity.x = (Math.sin(this.yaw) * -forward + Math.cos(this.yaw) * strafe) / length * speed;
    this.velocity.z = (Math.cos(this.yaw) * -forward - Math.sin(this.yaw) * strafe) / length * speed;
    if (input.consumeJump() && this.grounded) { this.velocity.y = 8.2; this.grounded = false; }
    this.velocity.y = Math.max(-28, this.velocity.y - 23 * dt);
    const steps = Math.max(1, Math.ceil(this.velocity.length() * dt / 0.25));
    for (let i = 0; i < steps; i++) this.move(this.velocity.clone().multiplyScalar(dt / steps));
    if (this.position.y < -10) this.respawn();
    this.syncCamera();
  }

  look(dx: number, dy: number): void {
    this.yaw -= dx * 0.0022; this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
  }

  respawn(): void {
    const spawn = this.world.generator.safeSpawn();
    this.position.set(spawn.x, spawn.y, spawn.z); this.velocity.set(0, 0, 0); this.yaw = 0; this.pitch = 0;
  }

  intersectsBlock(x: number, y: number, z: number): boolean {
    return this.position.x + RADIUS > x && this.position.x - RADIUS < x + 1 && this.position.y + HEIGHT > y && this.position.y < y + 1 && this.position.z + RADIUS > z && this.position.z - RADIUS < z + 1;
  }

  serialize(): SavedPlayer { return { x: this.position.x, y: this.position.y, z: this.position.z, yaw: this.yaw, pitch: this.pitch }; }

  private move(delta: THREE.Vector3): void {
    this.position.x += delta.x;
    if (this.collides()) { this.position.x -= delta.x; this.velocity.x = 0; }
    this.position.z += delta.z;
    if (this.collides()) { this.position.z -= delta.z; this.velocity.z = 0; }
    this.grounded = false;
    this.position.y += delta.y;
    if (this.collides()) {
      this.position.y -= delta.y;
      if (delta.y < 0) this.grounded = true;
      this.velocity.y = 0;
    }
  }

  private collides(): boolean {
    const minX = Math.floor(this.position.x - RADIUS), maxX = Math.floor(this.position.x + RADIUS);
    const minY = Math.floor(this.position.y), maxY = Math.floor(this.position.y + HEIGHT - 0.001);
    const minZ = Math.floor(this.position.z - RADIUS), maxZ = Math.floor(this.position.z + RADIUS);
    for (let x=minX;x<=maxX;x++) for(let y=minY;y<=maxY;y++) for(let z=minZ;z<=maxZ;z++) if (BLOCKS[this.world.getBlock(x,y,z)].solid) return true;
    return false;
  }

  private syncCamera(): void {
    this.camera.position.set(this.position.x, this.position.y + EYE, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
