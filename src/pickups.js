import { CFG, COLORS } from './config.js';

export class PickupManager {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.items = [];
    this.pool = [];
    this.maxItems = 16;

    for (let i = 0; i < this.maxItems; i++) {
      const spr = scene.add.sprite(0, 0, 'pickup_ammo')
        .setActive(false)
        .setVisible(false)
        .setDepth(20)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.pool.push({
        spr,
        active: false,
        type: 'ammo',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 7500
      });
    }
  }

  spawn(x, y, type = null) {
    const item = this.pool.find((p) => !p.active);
    if (!item) return null;

    if (!type) {
      type = this.rng() < 0.65 ? 'ammo' : 'shield';
    }

    item.active = true;
    item.type = type;
    item.x = x;
    item.y = y;
    const angle = this.rng() * Math.PI * 2;
    const speed = 20 + this.rng() * 40;
    item.vx = Math.cos(angle) * speed;
    item.vy = Math.sin(angle) * speed;
    item.maxLife = 7500;
    item.life = item.maxLife;

    item.spr.setTexture(type === 'ammo' ? 'pickup_ammo' : 'pickup_shield')
      .setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.3);

    this.scene.tweens.add({
      targets: item.spr,
      scale: 1,
      duration: 250,
      ease: 'Back.out'
    });

    return item;
  }

  update(dt, player, onCollect) {
    const magnetDist = 120;
    const pickupRadius = 24;

    for (const item of this.pool) {
      if (!item.active) continue;

      item.life -= dt * 1000;
      if (item.life <= 0) {
        this.release(item);
        continue;
      }

      // Blink when expiring
      if (item.life < 2500) {
        item.spr.setAlpha(Math.floor(item.life / 140) % 2 === 0 ? 1 : 0.25);
      } else {
        item.spr.setAlpha(1);
      }

      // Magnetic attraction to player
      if (player && !player.dead) {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= pickupRadius) {
          // Collected!
          onCollect(item.type, item.x, item.y);
          this.release(item);
          continue;
        } else if (dist <= magnetDist) {
          const pull = (1 - dist / magnetDist) * 320;
          item.vx += (dx / dist) * pull * dt;
          item.vy += (dy / dist) * pull * dt;
        }
      }

      // Drag
      item.vx *= Math.pow(0.85, dt * 60);
      item.vy *= Math.pow(0.85, dt * 60);

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      // Keep within arena boundaries
      const r = 14;
      item.x = Phaser.Math.Clamp(item.x, CFG.PLAY.x + r, CFG.PLAY.x + CFG.PLAY.w - r);
      item.y = Phaser.Math.Clamp(item.y, CFG.PLAY.y + r, CFG.PLAY.y + CFG.PLAY.h - r);

      item.spr.setPosition(item.x, item.y);
      item.spr.rotation += dt * 2.5;
    }
  }

  release(item) {
    item.active = false;
    item.spr.setActive(false).setVisible(false);
  }

  clear() {
    for (const item of this.pool) {
      this.release(item);
    }
  }
}
