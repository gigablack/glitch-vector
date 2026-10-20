import { CFG, COLORS } from './config.js';
import { clamp } from './rules.js';

export class ObstacleManager {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.cx = CFG.CUBE.cx;
    this.cy = CFG.CUBE.cy;
    this.angle = 0;
    this.rotSpeed = 0.5;
    this.layout = 'single';
    this.blocks = [];
    this.sprites = [];
    this.rotationMultiplier = 1;

    // Initialize 4 sprite pools for modular blocks
    for (let i = 0; i < 4; i++) {
      const spr = scene.add.sprite(this.cx, this.cy, 'obstacle_block')
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setActive(false)
        .setVisible(false);
      this.sprites.push(spr);
    }

    this.reconfigure();
  }

  setRotationMultiplier(mult = 1) {
    this.rotationMultiplier = mult;
  }

  reconfigure() {
    const layouts = ['single', 'dual', 'tri', 'quad'];
    const idx = Math.floor(this.rng() * layouts.length);
    this.layout = layouts[idx];
    this.rotSpeed = (0.35 + this.rng() * 0.7) * (this.rng() > 0.5 ? 1 : -1);

    this.blocks = [];
    const count = this.layout === 'single' ? 1
      : this.layout === 'dual' ? 2
      : this.layout === 'tri' ? 3 : 4;

    const baseDist = 55 + this.rng() * 45;

    for (let i = 0; i < 4; i++) {
      const spr = this.sprites[i];
      if (i < count) {
        spr.setActive(true).setVisible(true).setAlpha(0.9);
        const phase = (i * Math.PI * 2) / count;
        const block = {
          spr,
          phase,
          dist: count === 1 ? 0 : baseDist,
          w: count === 1 ? 120 : (60 + this.rng() * 30),
          h: count === 1 ? 120 : (30 + this.rng() * 20),
          x: this.cx,
          y: this.cy,
          rot: 0,
          r: 0
        };
        block.r = Math.hypot(block.w, block.h) / 2;
        spr.setDisplaySize(block.w, block.h);
        this.blocks.push(block);
      } else {
        spr.setActive(false).setVisible(false);
      }
    }
  }

  mutate() {
    this.reconfigure();
    // Flash and scale tween to show dynamic shift during glitch
    for (const b of this.blocks) {
      b.spr.setTint(COLORS.magenta);
      this.scene.tweens.add({
        targets: b.spr,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 200,
        yoyo: true,
        ease: 'Quad.out',
        onComplete: () => {
          b.spr.clearTint();
        }
      });
    }
  }

  update(dt) {
    this.angle += this.rotSpeed * this.rotationMultiplier * dt;

    for (const b of this.blocks) {
      const currentAngle = this.angle + b.phase;
      b.x = this.cx + Math.cos(currentAngle) * b.dist;
      b.y = this.cy + Math.sin(currentAngle) * b.dist;
      b.rot = currentAngle;
      b.spr.setPosition(b.x, b.y);
      b.spr.setRotation(b.rot);
    }
  }

  pulse() {
    for (const b of this.blocks) {
      b.spr.setScale(b.spr.scaleX * 1.05);
      this.scene.tweens.add({
        targets: b.spr,
        scaleX: b.spr.scaleX / 1.05,
        scaleY: b.spr.scaleY / 1.05,
        duration: 120,
        ease: 'Sine.out'
      });
    }
  }

  resolvePlayer(player) {
    const pr = CFG.PLAYER.r;
    for (const b of this.blocks) {
      const dx = player.x - b.x;
      const dy = player.y - b.y;
      const dist2 = dx * dx + dy * dy;
      const minD = b.r * 0.72 + pr;
      if (dist2 < minD * minD) {
        const d = Math.sqrt(dist2) || 1;
        const nx = dx / d;
        const ny = dy / d;
        player.x = b.x + nx * minD;
        player.y = b.y + ny * minD;
        const dot = player.vx * nx + player.vy * ny;
        if (dot < 0) {
          player.vx -= dot * nx;
          player.vy -= dot * ny;
        }
      }
    }
  }

  checkBulletHit(x, y, r = 4) {
    for (const b of this.blocks) {
      const dx = x - b.x;
      const dy = y - b.y;
      const d2 = dx * dx + dy * dy;
      const hitR = b.r * 0.65 + r;
      if (d2 <= hitR * hitR) {
        return true;
      }
    }
    return false;
  }

  // Returns primary bounding box for legacy reflect fallback if needed
  get primaryAABB() {
    if (!this.blocks.length) return CFG.CUBE;
    const b = this.blocks[0];
    return {
      x: b.x - b.w / 2,
      y: b.y - b.h / 2,
      w: b.w,
      h: b.h,
      cx: b.x,
      cy: b.y
    };
  }

  destroy() {
    for (const spr of this.sprites) spr.destroy();
    this.blocks = [];
  }
}
