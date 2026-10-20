import { CFG } from './config.js';
import { clamp } from './rules.js';

export class Player {
  constructor(scene) {
    this.spr = scene.add.sprite(CFG.PLAYER.x, CFG.PLAYER.y, 'player')
      .setDepth(30)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.reset();
  }

  reset() {
    this.x = CFG.PLAYER.x;
    this.y = CFG.PLAYER.y;
    this.vx = 0;
    this.vy = 0;
    this.shields = CFG.PLAYER.shields;
    this.invuln = 0;
    this.fireCd = 0;
    this.dead = false;
    this.spr.setPosition(this.x, this.y)
      .setVisible(true)
      .setAlpha(1)
      .setRotation(-Math.PI / 2);
  }

  update(dt, input, aimX, aimY) {
    this.fireCd = Math.max(0, this.fireCd - dt * 1000);
    if (this.dead) {
      this.spr.setVisible(false);
      return;
    }

    let ax = input.x;
    let ay = input.y;
    const len = Math.hypot(ax, ay);
    if (len > 0) {
      ax /= len;
      ay /= len;
    }

    const targetVx = ax * CFG.PLAYER.speed;
    const targetVy = ay * CFG.PLAYER.speed;
    const k = 1 - Math.exp((-dt * 1000) / CFG.PLAYER.tau);
    this.vx += (targetVx - this.vx) * k;
    this.vy += (targetVy - this.vy) * k;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const r = CFG.PLAYER.r;
    const left = CFG.PLAY.x + r;
    const right = CFG.PLAY.x + CFG.PLAY.w - r;
    const top = CFG.PLAY.y + r;
    const bottom = CFG.PLAY.y + CFG.PLAY.h - r;

    if (this.x < left) {
      this.x = left;
      this.vx = Math.max(0, this.vx);
    } else if (this.x > right) {
      this.x = right;
      this.vx = Math.min(0, this.vx);
    }
    if (this.y < top) {
      this.y = top;
      this.vy = Math.max(0, this.vy);
    } else if (this.y > bottom) {
      this.y = bottom;
      this.vy = Math.min(0, this.vy);
    }

    this.resolveCube();

    this.spr.setPosition(this.x, this.y);
    this.spr.setRotation(Math.atan2(aimY - this.y, aimX - this.x));

    if (this.invuln > 0) {
      this.invuln = Math.max(0, this.invuln - dt * 1000);
      this.spr.setAlpha(Math.floor(this.invuln / 100) % 2 === 0 ? 1 : 0.25);
    } else {
      this.spr.setAlpha(1);
    }
  }

  resolveCube() {
    const r = CFG.PLAYER.r;
    const cube = CFG.CUBE;
    const right = cube.x + cube.w;
    const bottom = cube.y + cube.h;
    const closestX = clamp(this.x, cube.x, right);
    const closestY = clamp(this.y, cube.y, bottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;
    const d2 = dx * dx + dy * dy;

    if (d2 > r * r) return;

    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      const dot = this.vx * nx + this.vy * ny;
      if (dot < 0) {
        this.vx -= dot * nx;
        this.vy -= dot * ny;
      }
      this.x = closestX + nx * (r + 0.01);
      this.y = closestY + ny * (r + 0.01);
      return;
    }

    const pl = this.x - cube.x;
    const pr = right - this.x;
    const pt = this.y - cube.y;
    const pb = bottom - this.y;
    const min = Math.min(pl, pr, pt, pb);

    if (min === pl) {
      this.x = cube.x - r - 0.01;
      this.vx = Math.min(0, this.vx);
    } else if (min === pr) {
      this.x = right + r + 0.01;
      this.vx = Math.max(0, this.vx);
    } else if (min === pt) {
      this.y = cube.y - r - 0.01;
      this.vy = Math.min(0, this.vy);
    } else {
      this.y = bottom + r + 0.01;
      this.vy = Math.max(0, this.vy);
    }
  }

  damage() {
    if (this.invuln > 0 || this.dead) return false;
    this.shields -= 1;
    this.invuln = CFG.PLAYER.invuln;
    if (this.shields <= 0) {
      this.shields = 0;
      this.dead = true;
      this.spr.setVisible(false);
    }
    return true;
  }

  canFire(activeBullets) {
    return !this.dead && this.fireCd <= 0 && activeBullets < CFG.PLAYER.maxBullets;
  }

  markFired() {
    this.fireCd = CFG.PLAYER.fireCd;
  }

  get muzzleX() {
    return this.x + Math.cos(this.spr.rotation) * (CFG.PLAYER.r + 7);
  }

  get muzzleY() {
    return this.y + Math.sin(this.spr.rotation) * (CFG.PLAYER.r + 7);
  }
}
