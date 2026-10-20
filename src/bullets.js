import { CFG, POOLS } from './config.js';
import { reflectAABB } from './rules.js';

export class BulletPool {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    const poolSize = Math.max(24, POOLS.playerBullets);
    for (let i = 0; i < poolSize; i++) {
      this.items.push({
        spr: scene.add.sprite(0, 0, 'bullet')
          .setActive(false)
          .setVisible(false)
          .setDepth(20)
          .setBlendMode(Phaser.BlendModes.ADD),
        active: false,
        vx: 0,
        vy: 0,
        life: 0,
        bounces: 0,
        pierce: false,
        prevX: 0,
        prevY: 0
      });
    }
  }

  spawn(x, y, angle, speedMult = 1, bounces = 0, pierce = false) {
    const item = this.items.find((entry) => !entry.active);
    if (!item) return false;
    item.active = true;
    item.life = CFG.BULLET.life;
    const speed = CFG.BULLET.speed * speedMult;
    item.vx = Math.cos(angle) * speed;
    item.vy = Math.sin(angle) * speed;
    item.bounces = bounces;
    item.pierce = pierce;
    item.prevX = x;
    item.prevY = y;
    item.spr.setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(pierce ? 1.4 : 1)
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

      let released = false;

      for (let i = 0; i < steps; i++) {
        spr.x += item.vx * step;
        spr.y += item.vy * step;

        const atXMin = spr.x < play.x + CFG.BULLET.r;
        const atXMax = spr.x > play.x + play.w - CFG.BULLET.r;
        const atYMin = spr.y < play.y + CFG.BULLET.r;
        const atYMax = spr.y > play.y + play.h - CFG.BULLET.r;

        if (atXMin || atXMax || atYMin || atYMax) {
          if (item.bounces > 0) {
            item.bounces--;
            if (atXMin) { spr.x = play.x + CFG.BULLET.r; item.vx = Math.abs(item.vx); }
            else if (atXMax) { spr.x = play.x + play.w - CFG.BULLET.r; item.vx = -Math.abs(item.vx); }
            if (atYMin) { spr.y = play.y + CFG.BULLET.r; item.vy = Math.abs(item.vy); }
            else if (atYMax) { spr.y = play.y + play.h - CFG.BULLET.r; item.vy = -Math.abs(item.vy); }
          } else {
            this.release(item);
            released = true;
            break;
          }
        }

        if (cube) {
          const bounced = reflectAABB(spr.x, spr.y, item.vx, item.vy, CFG.BULLET.r, cube);
          if (bounced.hit) {
            if (item.bounces > 0) {
              item.bounces--;
              spr.x = bounced.x;
              spr.y = bounced.y;
              item.vx = bounced.vx;
              item.vy = bounced.vy;
            } else {
              this.release(item);
              released = true;
              break;
            }
          }
        }

        spr.setRotation(Math.atan2(item.vy, item.vx));
      }

      if (released) continue;

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
    item.bounces = 0;
    item.pierce = false;
    item.spr.setActive(false).setVisible(false);
  }

  clear() {
    for (const item of this.items) this.release(item);
  }
}
