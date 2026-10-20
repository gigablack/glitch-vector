import { POOLS } from './config.js';

export class FxSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.scrollX = 0;
    this.scrollY = 0;

    this.grid1 = scene.add.tileSprite(640, 360, 1280, 720, 'grid')
      .setDepth(-20)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.grid2 = scene.add.tileSprite(640, 360, 1280, 720, 'grid2')
      .setDepth(-19)
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.particles = [];
    for (let i = 0; i < POOLS.particles; i++) {
      this.particles.push({
        spr: scene.add.sprite(0, 0, 'particle')
          .setActive(false)
          .setVisible(false)
          .setDepth(35)
          .setBlendMode(Phaser.BlendModes.ADD),
        active: false,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0
      });
    }

    this.texts = [];
    for (let i = 0; i < POOLS.texts; i++) {
      this.texts.push({
        txt: scene.add.text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(40).setActive(false).setVisible(false),
        active: false,
        life: 0,
        vy: 0
      });
    }

    this.telegraph = scene.add.graphics().setDepth(8);
  }

  burst(x, y, color, count = 12) {
    let made = 0;
    for (const particle of this.particles) {
      if (particle.active) continue;
      const angle = this.rng() * Math.PI * 2;
      const speed = 40 + this.rng() * 150;
      particle.active = true;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 300 + this.rng() * 400;
      particle.maxLife = particle.life;
      particle.spr.setPosition(x, y)
        .setActive(true)
        .setVisible(true)
        .setAlpha(1)
        .setScale(0.5 + this.rng() * 1.2)
        .setTint(color);
      made++;
      if (made >= count) break;
    }
    return made;
  }

  text(x, y, value, color = '#ffffff') {
    for (const item of this.texts) {
      if (item.active) continue;
      item.active = true;
      item.life = 700;
      item.vy = -40;
      item.txt.setPosition(x, y)
        .setText(value)
        .setColor(color)
        .setAlpha(1)
        .setActive(true)
        .setVisible(true);
      return true;
    }
    return false;
  }

  update(dt, disorient, now) {
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.life -= dt * 1000;
      if (particle.life <= 0) {
        particle.active = false;
        particle.spr.setActive(false).setVisible(false);
        continue;
      }
      particle.spr.x += particle.vx * dt;
      particle.spr.y += particle.vy * dt;
      particle.spr.setAlpha(Math.max(0, particle.life / particle.maxLife));
    }

    for (const item of this.texts) {
      if (!item.active) continue;
      item.life -= dt * 1000;
      if (item.life <= 0) {
        item.active = false;
        item.txt.setActive(false).setVisible(false);
        continue;
      }
      item.txt.y += item.vy * dt;
      item.txt.setAlpha(Math.min(1, item.life / 250));
    }

    this.scrollX += dt * 10;
    this.scrollY += dt * 5;
    const jx = disorient ? Math.sin(now * 0.125) * 6 : 0;
    const jy = disorient ? Math.cos(now * 0.125) * 4 : 0;
    this.grid1.tilePositionX = this.scrollX + jx;
    this.grid1.tilePositionY = this.scrollY + jy;
    this.grid2.tilePositionX = this.scrollX * 0.55 - jx * 0.6;
    this.grid2.tilePositionY = this.scrollY * 0.55 - jy * 0.6;
  }

  line(x1, y1, x2, y2, color, alpha = 0.7) {
    this.telegraph.lineStyle(2, color, alpha);
    this.telegraph.lineBetween(x1, y1, x2, y2);
  }

  clearLine() {
    this.telegraph.clear();
  }

  shake(intensity, duration) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(red, green, blue, duration = 120) {
    this.scene.cameras.main.flash(duration, red, green, blue);
  }

  clear() {
    for (const particle of this.particles) {
      particle.active = false;
      particle.spr.setActive(false).setVisible(false);
    }
    for (const item of this.texts) {
      item.active = false;
      item.txt.setActive(false).setVisible(false);
    }
    this.clearLine();
  }
}
