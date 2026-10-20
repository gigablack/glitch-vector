import { CFG } from './config.js';
import { clamp } from './rules.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.spr = scene.add.sprite(CFG.PLAYER.x, CFG.PLAYER.y, 'player')
      .setDepth(30)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.haloSpr = scene.add.sprite(CFG.PLAYER.x, CFG.PLAYER.y, 'halo_aegis')
      .setDepth(28)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.maxShields = CFG.PLAYER.shields;
    this.speedMult = 1;
    this.maxBulletsBonus = 0;
    this.fireCdMult = 1;

    // Tactical weapon profiles & 3-shot magazine cooldown
    this.magazineSize = 3;
    this.magazineShots = 3;
    this.reloadTime = 450;
    this.reloadCooldown = 0;
    this.fireMode = 'single';
    this.bulletBounces = 0;
    this.bulletPierce = false;
    this.burstRemaining = 0;
    this.burstTimer = 0;

    // Dynamic procedural traits
    this.rammingDamage = false;
    this.rammingPower = 1;
    this.extraCollisionDamage = false;
    this.heavyInertia = false;
    this.recoilKick = false;
    this.naniteRepair = false;
    this.retaliationEmp = false;
    this.stasisRounds = false;
    this.impactNova = false;
    this.magnetRadiusBonus = 0;
    this.overdriveTimer = 0;
    this.unlimitedAmmoTimer = 0;
    this.phaseInvulnTimer = 0;
    this.needRetaliationEmp = false;

    this.reset();
  }

  reset() {
    this.x = CFG.PLAYER.x;
    this.y = CFG.PLAYER.y;
    this.vx = 0;
    this.vy = 0;
    this.shields = this.maxShields || CFG.PLAYER.shields;
    this.invuln = 0;
    this.fireCd = 0;
    this.magazineShots = this.magazineSize;
    this.reloadCooldown = 0;
    this.burstRemaining = 0;
    this.burstTimer = 0;
    this.overdriveTimer = 0;
    this.unlimitedAmmoTimer = 0;
    this.phaseInvulnTimer = 0;
    this.needRetaliationEmp = false;
    this.dead = false;
    this.spr.setTexture('player')
      .setPosition(this.x, this.y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1)
      .clearTint()
      .setRotation(-Math.PI / 2);
    if (this.haloSpr) {
      this.haloSpr.setVisible(false);
    }
  }

  setModifiers(modifiers = {}) {
    this.speedMult = modifiers.speedMult || 1;
    this.maxBulletsBonus = modifiers.maxBulletsBonus || 0;
    this.fireCdMult = modifiers.fireCdMult || 1;
    this.fireMode = modifiers.fireMode || 'single';
    this.bulletBounces = modifiers.bulletBounces || 0;
    this.bulletPierce = !!modifiers.bulletPierce;
    this.magazineSize = modifiers.magazineSize || 3;
    this.rammingDamage = !!modifiers.rammingDamage;
    this.rammingPower = modifiers.rammingPower || 1;
    this.extraCollisionDamage = !!modifiers.extraCollisionDamage;
    this.heavyInertia = !!modifiers.heavyInertia;
    this.recoilKick = !!modifiers.recoilKick;
    this.naniteRepair = !!modifiers.naniteRepair;
    this.retaliationEmp = !!modifiers.retaliationEmp;
    this.stasisRounds = !!modifiers.stasisRounds;
    this.impactNova = !!modifiers.impactNova;
    this.magnetRadiusBonus = modifiers.magnetRadiusBonus || 0;

    if (modifiers.maxShields && modifiers.maxShields !== this.maxShields) {
      const diff = modifiers.maxShields - this.maxShields;
      this.maxShields = modifiers.maxShields;
      if (diff > 0) this.shields = Math.min(this.maxShields, this.shields + diff);
    }
  }

  healShield(amount = 1) {
    if (this.dead) return false;
    if (this.shields >= this.maxShields) return false;
    this.shields = Math.min(this.maxShields, this.shields + amount);
    return true;
  }

  update(dt, input, aimX, aimY, obstacles = null, inverted = false) {
    this.fireCd = Math.max(0, this.fireCd - dt * 1000);
    if (this.reloadCooldown > 0) {
      this.reloadCooldown = Math.max(0, this.reloadCooldown - dt * 1000);
      if (this.reloadCooldown <= 0) {
        this.magazineShots = this.magazineSize;
      }
    }

    if (this.dead) {
      this.spr.setVisible(false);
      if (this.haloSpr) this.haloSpr.setVisible(false);
      return;
    }

    // Keyboard movement (WASD / Arrow keys)
    let ax = input ? input.x : 0;
    let ay = input ? input.y : 0;
    const len = Math.hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }

    if (inverted) {
      ax = -ax;
      ay = -ay;
    }

    if (this.unlimitedAmmoTimer > 0) {
      this.unlimitedAmmoTimer = Math.max(0, this.unlimitedAmmoTimer - dt * 1000);
      this.magazineShots = this.magazineSize;
      this.reloadCooldown = 0;
    }
    if (this.phaseInvulnTimer > 0) {
      this.phaseInvulnTimer = Math.max(0, this.phaseInvulnTimer - dt * 1000);
    }
    if (this.overdriveTimer > 0) {
      this.overdriveTimer = Math.max(0, this.overdriveTimer - dt * 1000);
    }

    if (this.phaseInvulnTimer > 0) {
      this.spr.setTint(0x39ff14);
      this.spr.setAlpha(0.65 + Math.sin(Date.now() * 0.015) * 0.25);
    } else if (this.overdriveTimer > 0) {
      this.spr.setTint(0xffaa00);
      this.spr.setAlpha(1);
    } else if (this.unlimitedAmmoTimer > 0) {
      this.spr.setTint(0x00ffff);
      this.spr.setAlpha(1);
    } else if (this.invuln <= 0) {
      this.spr.clearTint();
      this.spr.setAlpha(1);
    }

    const overdriveBoost = this.overdriveTimer > 0 ? 1.4 : 1.0;
    const currentSpeed = CFG.PLAYER.speed * this.speedMult * overdriveBoost;
    const targetVx = ax * currentSpeed;
    const targetVy = ay * currentSpeed;
    const tau = CFG.PLAYER.tau * (this.heavyInertia ? 2.2 : (this.speedMult > 1.2 ? 1.3 : 1));
    const k = 1 - Math.exp((-dt * 1000) / tau);
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

    if (obstacles && obstacles.resolvePlayer) {
      obstacles.resolvePlayer(this);
    } else {
      this.resolveCube(CFG.CUBE);
    }

    this.spr.setPosition(this.x, this.y);
    this.spr.setRotation(Math.atan2(aimY - this.y, aimX - this.x));

    if (this.invuln > 0 && this.phaseInvulnTimer <= 0) {
      this.invuln = Math.max(0, this.invuln - dt * 1000);
      this.spr.setAlpha(Math.floor(this.invuln / 100) % 2 === 0 ? 1 : 0.25);
    }

    this.updateVisuals(dt);
  }

  updateVisuals(dt) {
    if (this.dead) {
      if (this.haloSpr) this.haloSpr.setVisible(false);
      return;
    }

    // 1. Morph hull shape based on primary weapon & combat traits
    let targetTexture = 'player';
    if (this.rammingDamage) {
      targetTexture = 'player_ram';
    } else if (this.bulletPierce || this.fireMode === 'pierce') {
      targetTexture = 'player_railgun';
    } else if (this.fireMode === 'spread') {
      targetTexture = 'player_spread';
    } else if (this.fireMode === 'burst') {
      targetTexture = 'player_burst';
    } else if (this.fireMode === 'trivector') {
      targetTexture = 'player_trivector';
    }

    if (this.spr.texture && this.spr.texture.key !== targetTexture) {
      this.spr.setTexture(targetTexture);
    }

    // 2. Halo / Aura selection & animation
    let hasHalo = false;
    let haloTexture = 'halo_aegis';

    if (this.phaseInvulnTimer > 0 || this.maxShields > 3 || this.naniteRepair) {
      hasHalo = true;
      haloTexture = 'halo_aegis';
    } else if (this.overdriveTimer > 0 || this.rammingDamage) {
      hasHalo = true;
      haloTexture = 'halo_kinetic';
    } else if (this.unlimitedAmmoTimer > 0 || this.fireCdMult < 0.8) {
      hasHalo = true;
      haloTexture = 'halo_overclock';
    }

    if (hasHalo && this.haloSpr) {
      if (this.haloSpr.texture && this.haloSpr.texture.key !== haloTexture) {
        this.haloSpr.setTexture(haloTexture);
      }
      this.haloSpr.setVisible(true);
      this.haloSpr.setPosition(this.x, this.y);
      this.haloSpr.rotation += dt * 2.8;
      const pulse = 0.95 + Math.sin(Date.now() * 0.008) * 0.12;
      this.haloSpr.setScale(pulse);
    } else if (this.haloSpr) {
      this.haloSpr.setVisible(false);
    }
  }

  resolveCube(cube) {
    if (!cube) return;
    const r = CFG.PLAYER.r;
    const right = cube.x + cube.w;
    const bottom = cube.y + cube.h;
    const closestX = clamp(this.x, cube.x, right);
    const closestY = clamp(this.y, cube.y, bottom);
    const dx = this.x - closestX;
    const dy = this.y - closestY;
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

  damage(isCollision = false) {
    if (this.phaseInvulnTimer > 0 || this.invuln > 0 || this.dead || this.overdriveTimer > 0) return false;
    const loss = (isCollision && this.extraCollisionDamage) ? 2 : 1;
    this.shields = Math.max(0, this.shields - loss);
    this.invuln = CFG.PLAYER.invuln;
    if (this.retaliationEmp && this.shields > 0) {
      this.needRetaliationEmp = true;
    }
    if (this.shields <= 0) {
      this.shields = 0;
      this.dead = true;
      this.spr.setVisible(false);
      if (this.haloSpr) this.haloSpr.setVisible(false);
    }
    return true;
  }

  canFire(activeBullets) {
    const maxB = CFG.PLAYER.maxBullets + this.maxBulletsBonus;
    if (this.dead) return false;
    if (this.unlimitedAmmoTimer > 0) {
      return this.fireCd <= 0 && activeBullets < maxB;
    }
    return this.fireCd <= 0 &&
      this.reloadCooldown <= 0 &&
      this.magazineShots > 0 &&
      activeBullets < maxB;
  }

  markFired() {
    if (this.unlimitedAmmoTimer > 0) {
      this.fireCd = CFG.PLAYER.fireCd * this.fireCdMult * 0.65;
      if (this.recoilKick) {
        this.vx -= Math.cos(this.spr.rotation) * 85;
        this.vy -= Math.sin(this.spr.rotation) * 85;
      }
      return;
    }
    this.fireCd = CFG.PLAYER.fireCd * this.fireCdMult;
    this.magazineShots--;
    if (this.recoilKick) {
      this.vx -= Math.cos(this.spr.rotation) * 85;
      this.vy -= Math.sin(this.spr.rotation) * 85;
    }
    if (this.magazineShots <= 0) {
      // 3-shot cooldown reload period
      this.reloadCooldown = this.reloadTime * (this.fireCdMult || 1);
    }
  }

  get muzzleX() {
    return this.x + Math.cos(this.spr.rotation) * (CFG.PLAYER.r + 7);
  }

  get muzzleY() {
    return this.y + Math.sin(this.spr.rotation) * (CFG.PLAYER.r + 7);
  }
}
