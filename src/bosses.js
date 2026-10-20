import { CFG, COLORS, ENEMY_DEFS } from './config.js';

export class BossController {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.activeBoss = null;
  }

  spawnBoss(wave, now, hpMult = 1) {
    if (this.activeBoss) this.killBoss();

    // Determine boss archetype based on wave
    // Wave 1, 7, 13... -> Core (0)
    // Wave 3, 9, 15... -> Worm (1)
    // Wave 5, 11, 17... -> Dragon (2)
    const bossIndex = Math.floor(((wave - 1) / 2)) % 3;

    if (bossIndex === 0) {
      this.activeBoss = new CoreBoss(this.scene, this.rng, wave, now, hpMult);
    } else if (bossIndex === 1) {
      this.activeBoss = new WormBoss(this.scene, this.rng, wave, now, hpMult);
    } else {
      this.activeBoss = new DragonBoss(this.scene, this.rng, wave, now, hpMult);
    }

    return this.activeBoss;
  }

  update(dt, now, player, speedMult, shoot, glitchDirector) {
    if (this.activeBoss) {
      this.activeBoss.update(dt, now, player, speedMult, shoot, glitchDirector);
    }
  }

  get boss() {
    return this.activeBoss;
  }

  checkBulletHit(bx, by, br) {
    if (!this.activeBoss) return false;
    return this.activeBoss.checkBulletHit(bx, by, br);
  }

  checkPlayerCollision(player) {
    if (!this.activeBoss || player.dead) return false;
    return this.activeBoss.checkPlayerCollision(player);
  }

  hit(damage = 1, now) {
    if (!this.activeBoss) return false;
    return this.activeBoss.takeDamage(damage, now);
  }

  killBoss() {
    if (!this.activeBoss) return;
    this.activeBoss.destroy();
    this.activeBoss = null;
  }
}

// ---------------------------------------------------------------------------
// BOSS 1: CORE SPHERE (Esfera Hexagonal Orbital)
// ---------------------------------------------------------------------------
class CoreBoss {
  constructor(scene, rng, wave, now, hpMult = 1) {
    this.scene = scene;
    this.rng = rng;
    this.type = 'core';
    this.name = 'CORE NEXUS';
    this.wave = wave;
    const baseHp = 35 + 8 * wave;
    this.maxHp = Math.round(baseHp * hpMult);
    this.hp = this.maxHp;
    this.r = ENEMY_DEFS.boss.r;
    this.phase = 1;
    this.time = 0;
    this.attackCount = 0;
    this.attackAt = now + 1800;
    this.pending = null;
    this.flashUntil = 0;

    this.spr = scene.add.sprite(640, 200, 'boss')
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  update(dt, now, player, speedMult, shoot, glitchDirector) {
    this.time += dt * speedMult;
    this.phase = this.hp <= this.maxHp * 0.45 ? 2 : 1;

    // Wide dynamic orbit across the screen (never stationary)
    const orbitSpeed = this.phase === 2 ? 1.4 : 0.95;
    this.spr.x = 640 + Math.sin(this.time * orbitSpeed) * 380;
    this.spr.y = 380 + Math.cos(this.time * orbitSpeed * 1.3) * 190;
    this.spr.rotation += dt * (this.phase === 2 ? 3.0 : 1.5);

    if (this.flashUntil && now >= this.flashUntil) {
      this.flashUntil = 0;
      if (this.phase === 2) this.spr.setTint(0xff66cc);
      else this.spr.clearTint();
    }

    if (this.pending) {
      if (now >= this.pending.fireAt) {
        if (this.pending.type === 'fan') {
          const base = Math.atan2(player.y - this.spr.y, player.x - this.spr.x);
          const count = this.phase === 2 ? 9 : 7;
          const spread = (16 * Math.PI) / 180;
          for (let i = -Math.floor(count / 2); i <= Math.floor(count / 2); i++) {
            const angle = base + i * spread;
            shoot(this.spr.x, this.spr.y, Math.cos(angle) * 200 * speedMult, Math.sin(angle) * 200 * speedMult, 'boss');
          }
        } else if (this.pending.type === 'radial') {
          const spokes = this.phase === 2 ? 20 : 14;
          for (let i = 0; i < spokes; i++) {
            const angle = (i * Math.PI * 2) / spokes + this.time;
            shoot(this.spr.x, this.spr.y, Math.cos(angle) * 160 * speedMult, Math.sin(angle) * 160 * speedMult, 'boss');
          }
        } else if (this.pending.type === 'glitchPulse' && glitchDirector) {
          glitchDirector.extendGlitch(4000);
        }

        this.pending = null;
        this.attackCount++;
        this.attackAt = now + (this.phase === 2 ? 1500 : 2200);
        if (this.phase === 2) this.spr.setTint(0xff66cc);
        else this.spr.clearTint();
      }
    } else if (now >= this.attackAt) {
      const isRadial = this.attackCount % 4 === 3;
      const isGlitch = this.phase === 2 && this.attackCount % 6 === 5;
      this.pending = {
        type: isGlitch ? 'glitchPulse' : (isRadial ? 'radial' : 'fan'),
        fireAt: now + (this.phase === 2 ? 380 : 500)
      };
      this.spr.setTint(0xffffff);
    }
  }

  checkBulletHit(bx, by, br) {
    const dx = bx - this.spr.x;
    const dy = by - this.spr.y;
    return dx * dx + dy * dy <= (this.r + br) * (this.r + br);
  }

  checkPlayerCollision(player) {
    const dx = player.x - this.spr.x;
    const dy = player.y - this.spr.y;
    return dx * dx + dy * dy <= (this.r + CFG.PLAYER.hitR) * (this.r + CFG.PLAYER.hitR);
  }

  takeDamage(amt, now) {
    this.hp -= amt;
    this.flashUntil = now + 60;
    this.spr.setTint(0xffffff);
    return this.hp <= 0;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.spr);
    this.spr.destroy();
  }
}

// ---------------------------------------------------------------------------
// BOSS 2: WORMDUNE (Gusano de Arena Vectorial Segmentado)
// ---------------------------------------------------------------------------
class WormBoss {
  constructor(scene, rng, wave, now, hpMult = 1) {
    this.scene = scene;
    this.rng = rng;
    this.type = 'worm';
    this.name = 'WORMDUNE PROTOCOL';
    this.wave = wave;
    const baseHp = 42 + 9 * wave;
    this.maxHp = Math.round(baseHp * hpMult);
    this.hp = this.maxHp;
    this.r = 26;
    this.phase = 1;
    this.time = 0;
    this.flashUntil = 0;
    this.attackAt = now + 1600;

    // Movement kinematics
    this.x = 640;
    this.y = -100;
    this.targetX = 640;
    this.targetY = 400;
    this.speed = 220;
    this.heading = Math.PI / 2;

    // Segments chain (head + 10 body + 1 tail)
    this.numSegments = 10;
    this.segmentDist = 26;
    this.segments = [];

    this.headSpr = scene.add.sprite(this.x, this.y, 'boss_worm_head')
      .setDepth(18).setBlendMode(Phaser.BlendModes.ADD);

    for (let i = 0; i < this.numSegments; i++) {
      const spr = scene.add.sprite(this.x, this.y, 'boss_worm_body')
        .setDepth(17 - i * 0.1).setBlendMode(Phaser.BlendModes.ADD);
      this.segments.push({ spr, x: this.x, y: this.y, r: 18 });
    }

    this.tailSpr = scene.add.sprite(this.x, this.y, 'boss_worm_tail')
      .setDepth(15).setBlendMode(Phaser.BlendModes.ADD);

    this.pickNewTarget();
  }

  pickNewTarget() {
    // Slithers across arena from edge to edge or towards player area
    const margin = 80;
    this.targetX = CFG.PLAY.x + margin + this.rng() * (CFG.PLAY.w - margin * 2);
    this.targetY = CFG.PLAY.y + margin + this.rng() * (CFG.PLAY.h - margin * 2);
  }

  update(dt, now, player, speedMult, shoot, glitchDirector) {
    this.time += dt * speedMult;
    this.phase = this.hp <= this.maxHp * 0.45 ? 2 : 1;
    const currentSpeed = (this.phase === 2 ? 290 : 220) * speedMult;

    // Steer head smoothly towards target
    const tx = this.targetX;
    const ty = this.targetY;
    const wantAngle = Math.atan2(ty - this.y, tx - this.x);
    let diff = Phaser.Math.Angle.Wrap(wantAngle - this.heading);
    this.heading += diff * Math.min(1, dt * (this.phase === 2 ? 4.5 : 3.0));

    // Add sinusoidal slither wave
    const slither = Math.sin(this.time * 7) * 0.28;
    const moveAngle = this.heading + slither;

    this.x += Math.cos(moveAngle) * currentSpeed * dt;
    this.y += Math.sin(moveAngle) * currentSpeed * dt;

    if (Math.hypot(tx - this.x, ty - this.y) < 60) {
      this.pickNewTarget();
    }

    // Wrap around screen edges so worm enters and exits seamlessly
    const pad = 120;
    if (this.x < CFG.PLAY.x - pad) this.x = CFG.PLAY.x + CFG.PLAY.w + pad;
    else if (this.x > CFG.PLAY.x + CFG.PLAY.w + pad) this.x = CFG.PLAY.x - pad;
    if (this.y < CFG.PLAY.y - pad) this.y = CFG.PLAY.y + CFG.PLAY.h + pad;
    else if (this.y > CFG.PLAY.y + CFG.PLAY.h + pad) this.y = CFG.PLAY.y - pad;

    this.headSpr.setPosition(this.x, this.y);
    this.headSpr.setRotation(this.heading);

    // Follow-the-leader kinematics for segments
    let prevX = this.x;
    let prevY = this.y;

    for (const seg of this.segments) {
      const dx = seg.x - prevX;
      const dy = seg.y - prevY;
      const dist = Math.hypot(dx, dy) || 1;
      seg.x = prevX + (dx / dist) * this.segmentDist;
      seg.y = prevY + (dy / dist) * this.segmentDist;
      seg.spr.setPosition(seg.x, seg.y);
      seg.spr.setRotation(Math.atan2(prevY - seg.y, prevX - seg.x));
      prevX = seg.x;
      prevY = seg.y;
    }

    // Tail follows last segment
    this.tailSpr.setPosition(prevX, prevY);
    this.tailSpr.setRotation(this.segments[this.segments.length - 1].spr.rotation);

    // Flash reset
    if (this.flashUntil && now >= this.flashUntil) {
      this.flashUntil = 0;
      this.headSpr.clearTint();
      for (const seg of this.segments) seg.spr.clearTint();
      this.tailSpr.clearTint();
    }

    // Attacks
    if (now >= this.attackAt) {
      // Head spits venomous cluster
      const base = Math.atan2(player.y - this.y, player.x - this.x);
      shoot(this.x, this.y, Math.cos(base) * 230 * speedMult, Math.sin(base) * 230 * speedMult, 'boss');

      if (this.phase === 2) {
        // Spine eruption from 3 middle segments
        for (let i = 2; i < this.segments.length; i += 3) {
          const seg = this.segments[i];
          const spineAngle = seg.spr.rotation + Math.PI / 2;
          shoot(seg.x, seg.y, Math.cos(spineAngle) * 160 * speedMult, Math.sin(spineAngle) * 160 * speedMult, 'boss');
          shoot(seg.x, seg.y, -Math.cos(spineAngle) * 160 * speedMult, -Math.sin(spineAngle) * 160 * speedMult, 'boss');
        }
      }

      this.attackAt = now + (this.phase === 2 ? 1400 : 2100);
    }
  }

  get spr() {
    return this.headSpr;
  }

  checkBulletHit(bx, by, br) {
    // Can hit head
    if (Math.hypot(bx - this.x, by - this.y) <= (this.r + br)) return true;
    // Or any segment
    for (const seg of this.segments) {
      if (Math.hypot(bx - seg.x, by - seg.y) <= (seg.r + br)) return true;
    }
    return false;
  }

  checkPlayerCollision(player) {
    if (Math.hypot(player.x - this.x, player.y - this.y) <= (this.r + CFG.PLAYER.hitR)) return true;
    for (const seg of this.segments) {
      if (Math.hypot(player.x - seg.x, player.y - seg.y) <= (seg.r + CFG.PLAYER.hitR)) return true;
    }
    return false;
  }

  takeDamage(amt, now) {
    this.hp -= amt;
    this.flashUntil = now + 60;
    this.headSpr.setTint(0xffffff);
    for (const seg of this.segments) seg.spr.setTint(0xffffff);
    this.tailSpr.setTint(0xffffff);
    return this.hp <= 0;
  }

  destroy() {
    this.headSpr.destroy();
    for (const seg of this.segments) seg.spr.destroy();
    this.tailSpr.destroy();
  }
}

// ---------------------------------------------------------------------------
// BOSS 3: CYBERDRAGON (Dragón Vectorial con Alas y Aliento de Plasma)
// ---------------------------------------------------------------------------
class DragonBoss {
  constructor(scene, rng, wave, now, hpMult = 1) {
    this.scene = scene;
    this.rng = rng;
    this.type = 'dragon';
    this.name = 'AERODRAGON MATRIX';
    this.wave = wave;
    const baseHp = 50 + 10 * wave;
    this.maxHp = Math.round(baseHp * hpMult);
    this.hp = this.maxHp;
    this.r = 34;
    this.phase = 1;
    this.time = 0;
    this.flashUntil = 0;
    this.attackAt = now + 1500;
    this.diveTimer = now + 7000;
    this.isDiving = false;

    this.x = 640;
    this.y = 160;
    this.vx = 0;
    this.vy = 0;

    this.headSpr = scene.add.sprite(this.x, this.y, 'boss_dragon_head')
      .setDepth(19).setBlendMode(Phaser.BlendModes.ADD);

    this.leftWing = scene.add.sprite(this.x, this.y, 'boss_dragon_wing')
      .setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    this.rightWing = scene.add.sprite(this.x, this.y, 'boss_dragon_wing')
      .setDepth(18).setBlendMode(Phaser.BlendModes.ADD).setFlipY(true);

    this.segments = [];
    for (let i = 0; i < 7; i++) {
      const spr = scene.add.sprite(this.x, this.y, 'boss_dragon_body')
        .setDepth(16 - i * 0.1).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1 - i * 0.08);
      this.segments.push({ spr, x: this.x, y: this.y, r: 20 - i * 1.5 });
    }
  }

  update(dt, now, player, speedMult, shoot, glitchDirector) {
    this.time += dt * speedMult;
    this.phase = this.hp <= this.maxHp * 0.35 ? 3 : (this.hp <= this.maxHp * 0.65 ? 2 : 1);

    // Movement: Figure-8 sweep across arena
    if (this.isDiving) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > CFG.PLAY.y + CFG.PLAY.h + 80 || this.x < CFG.PLAY.x - 80 || this.x > CFG.PLAY.x + CFG.PLAY.w + 80) {
        this.isDiving = false;
        this.x = 640;
        this.y = 120;
        this.diveTimer = now + 9000;
      }
    } else {
      const freq = this.phase === 3 ? 1.4 : 1.0;
      const targetX = 640 + Math.sin(this.time * freq) * 360;
      const targetY = 260 + Math.sin(this.time * freq * 2) * 140;
      this.x += (targetX - this.x) * Math.min(1, dt * 4);
      this.y += (targetY - this.y) * Math.min(1, dt * 4);

      if (now >= this.diveTimer) {
        this.isDiving = true;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const diveSpeed = 540 * speedMult;
        this.vx = Math.cos(angle) * diveSpeed;
        this.vy = Math.sin(angle) * diveSpeed;
      }
    }

    const headAngle = Math.atan2(player.y - this.y, player.x - this.x);
    this.headSpr.setPosition(this.x, this.y);
    this.headSpr.setRotation(this.isDiving ? Math.atan2(this.vy, this.vx) : headAngle);

    // Wing flap animation
    const flap = Math.sin(this.time * (this.isDiving ? 16 : 8)) * 0.45;
    const wingDist = 42;
    const perp = this.headSpr.rotation + Math.PI / 2;
    this.leftWing.setPosition(this.x + Math.cos(perp) * wingDist, this.y + Math.sin(perp) * wingDist);
    this.leftWing.setRotation(this.headSpr.rotation + flap);
    this.rightWing.setPosition(this.x - Math.cos(perp) * wingDist, this.y - Math.sin(perp) * wingDist);
    this.rightWing.setRotation(this.headSpr.rotation - flap);

    // Body segments follow
    let prevX = this.x;
    let prevY = this.y;
    for (const seg of this.segments) {
      const dx = seg.x - prevX;
      const dy = seg.y - prevY;
      const dist = Math.hypot(dx, dy) || 1;
      seg.x = prevX + (dx / dist) * 26;
      seg.y = prevY + (dy / dist) * 26;
      seg.spr.setPosition(seg.x, seg.y);
      seg.spr.setRotation(Math.atan2(prevY - seg.y, prevX - seg.x));
      prevX = seg.x;
      prevY = seg.y;
    }

    // Flash reset
    if (this.flashUntil && now >= this.flashUntil) {
      this.flashUntil = 0;
      this.headSpr.clearTint();
      this.leftWing.clearTint();
      this.rightWing.clearTint();
      for (const seg of this.segments) seg.spr.clearTint();
    }

    // Attacks: Plasma Breath & Multi-barrage
    if (now >= this.attackAt) {
      const base = this.headSpr.rotation;
      // Plasma breath spray
      for (let i = -2; i <= 2; i++) {
        const spread = base + (i * 12 * Math.PI) / 180;
        shoot(this.x, this.y, Math.cos(spread) * 240 * speedMult, Math.sin(spread) * 240 * speedMult, 'boss');
      }

      if (this.phase >= 2) {
        // Wing discharge
        shoot(this.leftWing.x, this.leftWing.y, Math.cos(base + 0.8) * 190 * speedMult, Math.sin(base + 0.8) * 190 * speedMult, 'boss');
        shoot(this.rightWing.x, this.rightWing.y, Math.cos(base - 0.8) * 190 * speedMult, Math.sin(base - 0.8) * 190 * speedMult, 'boss');
      }

      if (this.phase === 3 && glitchDirector && !glitchDirector.isActive) {
        // Dragon Phase 3 triggers dual glitch combo
        glitchDirector.startCombined('invert', 'overclock');
      }

      this.attackAt = now + (this.phase === 3 ? 1200 : (this.phase === 2 ? 1600 : 2200));
    }
  }

  get spr() {
    return this.headSpr;
  }

  checkBulletHit(bx, by, br) {
    if (Math.hypot(bx - this.x, by - this.y) <= (this.r + br)) return true;
    for (const seg of this.segments) {
      if (Math.hypot(bx - seg.x, by - seg.y) <= (seg.r + br)) return true;
    }
    return false;
  }

  checkPlayerCollision(player) {
    if (Math.hypot(player.x - this.x, player.y - this.y) <= (this.r + CFG.PLAYER.hitR)) return true;
    for (const seg of this.segments) {
      if (Math.hypot(player.x - seg.x, player.y - seg.y) <= (seg.r + CFG.PLAYER.hitR)) return true;
    }
    return false;
  }

  takeDamage(amt, now) {
    this.hp -= amt;
    this.flashUntil = now + 60;
    this.headSpr.setTint(0xffffff);
    this.leftWing.setTint(0xffffff);
    this.rightWing.setTint(0xffffff);
    for (const seg of this.segments) seg.spr.setTint(0xffffff);
    return this.hp <= 0;
  }

  destroy() {
    this.headSpr.destroy();
    this.leftWing.destroy();
    this.rightWing.destroy();
    for (const seg of this.segments) seg.spr.destroy();
  }
}
