import { CFG, POOLS } from './config.js';
import { reflectAABB } from './rules.js';

export class BulletPool {
  constructor(scene) {
    this.items = [];
    for (let i = 0; i < POOLS.playerBullets; i++) {
      this.items.push({
        spr: scene.add.sprite(0, 0, 'bullet')
          .setActive(false)
          .setVisible(false)
          .setDepth(20)
          .setBlendMode(Phaser.BlendModes.ADD),
        active: false,
        vx: 0,
        vy: 0,
        life: 0
      });
    }
  }

  spawn(x, y, angle) {
    const item = this.items.find((entry) => !entry.active);
    if (!item) return false;
    item.active = true;
    item.life = CFG.BULLET.life;
    item.vx = Math.cos(angle) * CFG.BULLET.speed;
    item.vy = Math.sin(angle) * CFG.BULLET.speed;
    item.spr.setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1)
      .setRotation(angle);
    return true;
  }

  update(dt, cube, play) {
    for (const item of this.items) {
      if (!item.active) continue;
      const spr = item.spr;
      item.prevX = spr.x;
      item.prevY = spr.y;
      const distance = Math.hypot(item.vx, item.vy) * dt;
      const steps = Math.max(1, Math.ceil(distance / 8));
      const step = dt / steps;

      for (let i = 0; i < steps; i++) {
        spr.x += item.vx * step;
        spr.y += item.vy * step;

        if (spr.x < play.x + CFG.BULLET.r) {
          spr.x = play.x + CFG.BULLET.r;
          item.vx = Math.abs(item.vx);
        } else if (spr.x > play.x + play.w - CFG.BULLET.r) {
          spr.x = play.x + play.w - CFG.BULLET.r;
          item.vx = -Math.abs(item.vx);
        }
        if (spr.y < play.y + CFG.BULLET.r) {
          spr.y = play.y + CFG.BULLET.r;
          item.vy = Math.abs(item.vy);
        } else if (spr.y > play.y + play.h - CFG.BULLET.r) {
          spr.y = play.y + play.h - CFG.BULLET.r;
          item.vy = -Math.abs(item.vy);
        }

        const bounced = reflectAABB(spr.x, spr.y, item.vx, item.vy, CFG.BULLET.r, cube);
        if (bounced.hit) {
          spr.x = bounced.x;
          spr.y = bounced.y;
          item.vx = bounced.vx;
          item.vy = bounced.vy;
        }
        spr.setRotation(Math.atan2(item.vy, item.vx));
      }

      item.life -= dt * 1000;
      if (item.life <= 0) this.release(item);
    }
  }

  activeCount() {
    let count = 0;
    for (const item of this.items) if (item.active) count++;
    return count;
  }

  forEach(fn) {
    for (const item of this.items) if (item.active) fn(item);
  }

  release(item) {
    item.active = false;
    item.life = 0;
    item.spr.setActive(false).setVisible(false);
  }

  clear() {
    for (const item of this.items) this.release(item);
  }
}
