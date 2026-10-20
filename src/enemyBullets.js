import { POOLS } from './config.js';
import { hitsRect } from './rules.js';

export class EnemyBulletPool {
  constructor(scene) {
    this.items = [];
    for (let i = 0; i < POOLS.enemyBullets; i++) {
      this.items.push({
        spr: scene.add.sprite(0, 0, 'ebullet')
          .setActive(false)
          .setVisible(false)
          .setDepth(18)
          .setBlendMode(Phaser.BlendModes.ADD),
        active: false,
        vx: 0,
        vy: 0,
        life: 0,
        r: 5
      });
    }
  }

  spawn(x, y, vx, vy, kind) {
    const item = this.items.find((entry) => !entry.active);
    if (!item) return false;
    item.active = true;
    item.life = 6000;
    item.vx = vx;
    item.vy = vy;
    item.r = kind === 'boss' ? 6 : 5;
    item.spr.setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(kind === 'boss' ? 1.25 : 1)
      .setRotation(Math.atan2(vy, vx));
    return true;
  }

  update(dt, play, cube) {
    for (const item of this.items) {
      if (!item.active) continue;
      const spr = item.spr;
      item.prevX = spr.x;
      item.prevY = spr.y;
      spr.x += item.vx * dt;
      spr.y += item.vy * dt;

      if (hitsRect(spr.x, spr.y, item.r, cube) ||
          spr.x < play.x - 30 || spr.x > play.x + play.w + 30 ||
          spr.y < play.y - 30 || spr.y > play.y + play.h + 30) {
        this.release(item);
        continue;
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
