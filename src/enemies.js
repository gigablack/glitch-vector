import { CFG, ENEMY_DEFS, POOLS } from './config.js';
import { enemySpeed, hitsRect, reflectAABB } from './rules.js';

export class EnemyManager {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.pools = {};
    this.boss = null;
    this.corners = [[60, 140], [1220, 140], [60, 660], [1220, 660]];

    for (const type of Object.keys(POOLS)) {
      if (ENEMY_DEFS[type]) this.pools[type] = this.makePool(type, POOLS[type]);
    }
  }

  makePool(type, count) {
    const def = ENEMY_DEFS[type];
    const pool = [];
    for (let i = 0; i < count; i++) {
      const spr = this.scene.add.sprite(0, 0, def.texture)
        .setActive(false)
        .setVisible(false)
        .setDepth(16)
        .setBlendMode(Phaser.BlendModes.ADD);
      pool.push({
        spr, type, def, active: false, hp: 0, r: def.r,
        vx: 0, vy: 0, speed: 0, nextThink: 0, flashUntil: 0,
        telegraph: false, telegraphUntil: 0, fireAt: 0,
        targetX: 0, targetY: 0, dashing: false,
        prevX: 0, prevY: 0
      });
    }
    return pool;
  }

  spawn(type, x, y, vx, vy, wave, now) {
    const pool = this.pools[type];
    if (!pool) return null;
    const enemy = pool.find((entry) => !entry.active);
    if (!enemy) return null;
    const def = ENEMY_DEFS[type];
    enemy.active = true;
    enemy.hp = def.hp;
    enemy.r = def.r;
    enemy.speed = enemySpeed(type, wave);
    enemy.vx = vx;
    enemy.vy = vy;
    enemy.nextThink = now + 900 + this.rng() * 500;
    enemy.flashUntil = 0;
    enemy.telegraph = false;
    enemy.telegraphUntil = 0;
    enemy.fireAt = now + 1200 + this.rng() * 800;
    enemy.dashing = false;
    enemy.prevX = x;
    enemy.prevY = y;
    enemy.spr.setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.4)
      .setDepth(16)
      .setRotation(Math.atan2(vy, vx))
      .clearTint();
    this.scene.tweens.add({
      targets: enemy.spr,
      scale: 1,
      duration: 300,
      ease: 'Back.out'
    });
    return enemy;
  }

  spawnAtEdge(type, player, wave, now) {
    if (type === 'sniper') {
      let best = this.corners[0];
      let bestDist = -1;
      for (const corner of this.corners) {
        const d = Math.hypot(corner[0] - player.x, corner[1] - player.y);
        if (d > bestDist) {
          bestDist = d;
          best = corner;
        }
      }
      const enemy = this.spawn(type, best[0], best[1], 0, 0, wave, now);
      if (enemy) {
        enemy.fireAt = now + 1400 + this.rng() * 800;
        enemy.nextThink = now + 3000 + this.rng() * 1000;
      }
      return enemy;
    }

    const margin = 34;
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      const side = Math.floor(this.rng() * 4);
      if (side === 0) {
        x = CFG.PLAY.x + margin + this.rng() * (CFG.PLAY.w - margin * 2);
        y = CFG.PLAY.y + margin;
      } else if (side === 1) {
        x = CFG.PLAY.x + CFG.PLAY.w - margin;
        y = CFG.PLAY.y + margin + this.rng() * (CFG.PLAY.h - margin * 2);
      } else if (side === 2) {
        x = CFG.PLAY.x + margin + this.rng() * (CFG.PLAY.w - margin * 2);
        y = CFG.PLAY.y + CFG.PLAY.h - margin;
      } else {
        x = CFG.PLAY.x + margin;
        y = CFG.PLAY.y + margin + this.rng() * (CFG.PLAY.h - margin * 2);
      }
      if (Math.hypot(x - player.x, y - player.y) >= CFG.WAVE.safeDist) break;
    }

    if (Math.hypot(x - player.x, y - player.y) < CFG.WAVE.safeDist) {
      const far = this.corners.reduce((bestCorner, corner) => {
        const d = Math.hypot(corner[0] - player.x, corner[1] - player.y);
        const bd = Math.hypot(bestCorner[0] - player.x, bestCorner[1] - player.y);
        return d > bd ? corner : bestCorner;
      }, this.corners[0]);
      x = far[0];
      y = far[1];
    }

    const speed = enemySpeed(type, wave);
    let angle;
    if (type === 'chaser') {
      angle = Math.atan2(player.y - y, player.x - x);
    } else {
      angle = this.rng() * Math.PI * 2;
    }
    return this.spawn(type, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, wave, now);
  }

  getActiveTypes() {
    const types = new Set();
    for (const pool of Object.values(this.pools)) {
      for (const enemy of pool) {
        if (enemy.active) types.add(enemy.type);
      }
    }
    return [...types];
  }

  countActive() {
    let count = 0;
    for (const pool of Object.values(this.pools)) {
      for (const enemy of pool) if (enemy.active) count++;
    }
    return count;
  }

  forEachActive(fn) {
    for (const pool of Object.values(this.pools)) {
      for (const enemy of pool) if (enemy.active) fn(enemy);
    }
  }

  release(enemy) {
    enemy.active = false;
    enemy.telegraph = false;
    this.scene.tweens.killTweensOf(enemy.spr);
    enemy.spr.setActive(false).setVisible(false).clearTint();
  }

  clear() {
    for (const pool of Object.values(this.pools)) {
      for (const enemy of pool) {
        if (enemy.active) this.release(enemy);
      }
    }
    this.killBoss();
  }

  spawnBoss(wave, now) {
    if (this.boss) return this.boss;
    const spr = this.scene.add.sprite(640, 180, 'boss')
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.boss = {
      spr,
      wave,
      hp: 40 + 6 * wave,
      maxHp: 40 + 6 * wave,
      r: ENEMY_DEFS.boss.r,
      phase: 1,
      time: 0,
      attackCount: 0,
      attackAt: now + 2400,
      pending: null,
      flashUntil: 0
    };
    return this.boss;
  }

  killBoss() {
    if (!this.boss) return;
    this.scene.tweens.killTweensOf(this.boss.spr);
    this.boss.spr.destroy();
    this.boss = null;
  }

  update(dt, now, player, speedMult, cube, shoot, wave) {
    for (const type of Object.keys(this.pools)) {
      for (const enemy of this.pools[type]) {
        if (!enemy.active) continue;
        enemy.prevX = enemy.spr.x;
        enemy.prevY = enemy.spr.y;
        if (enemy.flashUntil && now >= enemy.flashUntil) {
          enemy.flashUntil = 0;
          if (!enemy.telegraph) enemy.spr.clearTint();
        }

        if (type === 'sniper') {
          this.updateSniper(enemy, dt, now, player, speedMult, shoot, wave, cube);
        } else {
          if (type === 'chaser') {
            const dx = player.x - enemy.spr.x;
            const dy = player.y - enemy.spr.y;
            const dist = Math.hypot(dx, dy) || 1;
            const k = 1 - Math.exp(-3.5 * dt);
            enemy.vx += ((dx / dist) * enemy.speed - enemy.vx) * k;
            enemy.vy += ((dy / dist) * enemy.speed - enemy.vy) * k;
          } else if (type === 'tank' && now >= enemy.nextThink) {
            const angle = this.rng() * Math.PI * 2;
            enemy.vx = Math.cos(angle) * enemy.speed;
            enemy.vy = Math.sin(angle) * enemy.speed;
            enemy.nextThink = now + 900 + this.rng() * 500;
          }

          enemy.spr.x += enemy.vx * dt * speedMult;
          enemy.spr.y += enemy.vy * dt * speedMult;
          this.bounce(enemy, cube);
          enemy.spr.setRotation(Math.atan2(enemy.vy, enemy.vx));
        }
      }
    }

    if (this.boss) this.updateBoss(dt, now, player, speedMult, shoot);
  }

  bounce(enemy, cube) {
    const spr = enemy.spr;
    const r = enemy.r;
    if (spr.x < CFG.PLAY.x + r) {
      spr.x = CFG.PLAY.x + r;
      enemy.vx = Math.abs(enemy.vx);
    } else if (spr.x > CFG.PLAY.x + CFG.PLAY.w - r) {
      spr.x = CFG.PLAY.x + CFG.PLAY.w - r;
      enemy.vx = -Math.abs(enemy.vx);
    }
    if (spr.y < CFG.PLAY.y + r) {
      spr.y = CFG.PLAY.y + r;
      enemy.vy = Math.abs(enemy.vy);
    } else if (spr.y > CFG.PLAY.y + CFG.PLAY.h - r) {
      spr.y = CFG.PLAY.y + CFG.PLAY.h - r;
      enemy.vy = -Math.abs(enemy.vy);
    }

    const hit = reflectAABB(spr.x, spr.y, enemy.vx, enemy.vy, r, cube);
    if (hit.hit) {
      spr.x = hit.x;
      spr.y = hit.y;
      enemy.vx = hit.vx;
      enemy.vy = hit.vy;
    }
  }

  updateSniper(enemy, dt, now, player, speedMult, shoot, wave, cube) {
    if (enemy.telegraph) {
      if (now >= enemy.telegraphUntil) {
        const angle = Math.atan2(player.y - enemy.spr.y, player.x - enemy.spr.x);
        const speed = Math.min(320, 200 + (wave - 1) * 6) * speedMult;
        shoot(
          enemy.spr.x, enemy.spr.y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          'sniper'
        );
        enemy.telegraph = false;
        enemy.fireAt = now + 2200;
        enemy.spr.clearTint();
      }
      return;
    }

    if (enemy.dashing) {
      enemy.spr.x += enemy.vx * dt * speedMult;
      enemy.spr.y += enemy.vy * dt * speedMult;
      if (hitsRect(enemy.spr.x, enemy.spr.y, enemy.r, cube)) {
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.dashing = false;
        enemy.nextThink = now + 1000;
        return;
      }
      if (Math.hypot(enemy.targetX - enemy.spr.x, enemy.targetY - enemy.spr.y) < 8) {
        enemy.spr.x = enemy.targetX;
        enemy.spr.y = enemy.targetY;
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.dashing = false;
        enemy.nextThink = now + 3000 + this.rng() * 1000;
      }
      return;
    }

    if (now >= enemy.nextThink) {
      let target = this.corners[Math.floor(this.rng() * this.corners.length)];
      if (Math.hypot(target[0] - enemy.spr.x, target[1] - enemy.spr.y) < 20) {
        target = this.corners[(this.corners.indexOf(target) + 1) % this.corners.length];
      }
      enemy.targetX = target[0];
      enemy.targetY = target[1];
      const angle = Math.atan2(target[1] - enemy.spr.y, target[0] - enemy.spr.x);
      enemy.vx = Math.cos(angle) * 260;
      enemy.vy = Math.sin(angle) * 260;
      enemy.dashing = true;
    }

    if (now >= enemy.fireAt) {
      enemy.telegraph = true;
      enemy.telegraphUntil = now + 400;
      enemy.spr.setTint(0xff3355);
    }
  }

  updateBoss(dt, now, player, speedMult, shoot) {
    const boss = this.boss;
    boss.time += dt * speedMult;
    boss.spr.x = 640 + Math.sin(boss.time * 1.2) * 240;
    boss.spr.y = 180;
    boss.phase = boss.hp <= boss.maxHp / 2 ? 2 : 1;

    if (boss.flashUntil && now >= boss.flashUntil) {
      boss.flashUntil = 0;
      if (boss.phase === 2) boss.spr.setTint(0xff88ff);
      else boss.spr.clearTint();
    }

    if (boss.pending) {
      if (now >= boss.pending.fireAt) {
        if (boss.pending.type === 'fan') {
          const base = Math.atan2(player.y - boss.spr.y, player.x - boss.spr.x);
          for (let i = -3; i <= 3; i++) {
            const angle = base + (i * 18 * Math.PI) / 180;
            shoot(
              boss.spr.x, boss.spr.y,
              Math.cos(angle) * 190 * speedMult,
              Math.sin(angle) * 190 * speedMult,
              'boss'
            );
          }
        } else {
          for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI * 2) / 16;
            shoot(
              boss.spr.x, boss.spr.y,
              Math.cos(angle) * 140 * speedMult,
              Math.sin(angle) * 140 * speedMult,
              'boss'
            );
          }
        }
        boss.pending = null;
        boss.attackCount++;
        boss.attackAt = now + (boss.phase === 2 ? 1800 : 2400);
        if (boss.phase === 2) boss.spr.setTint(0xff88ff);
        else boss.spr.clearTint();
      }
    } else if (now >= boss.attackAt) {
      boss.pending = {
        type: boss.attackCount % 5 === 4 ? 'radial' : 'fan',
        fireAt: now + 500
      };
      boss.spr.setTint(0xffffff);
    }
  }
}
