import { CFG, COLORS } from './config.js';

export class VignetteSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageAlpha = 0;
    this.hitAlpha = 0;
    this.tunnelVision = false;
    this.lowHealth = false;
    this.pulseTime = 0;

    // Graphics overlay layer (between arena/enemies and player/HUD)
    this.graphics = scene.add.graphics()
      .setDepth(26)
      .setScrollFactor(0);

    // Vignette border canvas texture
    this.createVignetteTexture();
    this.vignetteDamage = scene.add.image(CFG.W / 2, CFG.H / 2, 'vignette_border')
      .setDepth(93)
      .setScrollFactor(0)
      .setTint(0xff2244)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.vignetteHit = scene.add.image(CFG.W / 2, CFG.H / 2, 'vignette_border')
      .setDepth(94)
      .setScrollFactor(0)
      .setTint(0x39ff14)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  createVignetteTexture() {
    if (this.scene.textures.exists('vignette_border')) return;
    const canvas = document.createElement('canvas');
    canvas.width = CFG.W;
    canvas.height = CFG.H;
    const ctx = canvas.getContext('2d');

    const w = CFG.W;
    const h = CFG.H;
    const cx = w / 2;
    const cy = h / 2;
    const outerRadius = Math.hypot(cx, cy);
    const innerRadius = Math.min(w, h) * 0.32;

    const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 1)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.scene.textures.addCanvas('vignette_border', canvas);
  }

  triggerDamage(intensity = 0.9) {
    this.damageAlpha = Math.max(this.damageAlpha, intensity);
  }

  triggerHit(intensity = 0.45) {
    this.hitAlpha = Math.max(this.hitAlpha, intensity);
  }

  setTunnelVision(enabled) {
    this.tunnelVision = enabled;
  }

  setLowHealth(enabled) {
    this.lowHealth = enabled;
  }

  update(dt, player) {
    // Decay damage vignette
    if (this.damageAlpha > 0) {
      this.damageAlpha = Math.max(0, this.damageAlpha - dt * 2.8);
    }

    // Decay hit vignette
    if (this.hitAlpha > 0) {
      this.hitAlpha = Math.max(0, this.hitAlpha - dt * 4.5);
    }

    // Low health pulsation
    let ambientDamageAlpha = 0;
    if (this.lowHealth && player && !player.dead) {
      this.pulseTime += dt * 4.5;
      ambientDamageAlpha = 0.18 + Math.sin(this.pulseTime) * 0.14;
    } else {
      this.pulseTime = 0;
    }

    const effectiveDamage = Math.max(this.damageAlpha, ambientDamageAlpha);
    this.vignetteDamage.setAlpha(effectiveDamage);
    this.vignetteHit.setAlpha(this.hitAlpha);

    // Draw tunnel vision (blind spot) if enabled
    this.graphics.clear();
    if (this.tunnelVision && player && !player.dead) {
      this.drawTunnelVision(player);
    }
  }

  drawTunnelVision(player) {
    const px = player.x;
    const py = player.y;
    const rot = player.spr.rotation;
    // Frontal vision cone: wide tactical sector (120 degrees)
    const coneAngle = (120 * Math.PI) / 180;
    const half = coneAngle / 2;
    const innerR = 75; // Proximity safety bubble: ship, halo & wings 100% visible
    const outerR = 1500; // Far exceeds screen diagonal from any player position

    // Blind sector spans the rear/flanks outside the frontal cone:
    const aStart = rot + half;
    const aEnd = rot + Math.PI * 2 - half;
    const sweep = aEnd - aStart; // ~240 degrees of darkness
    const steps = 32;

    const points = [];
    // 1. Outer perimeter arc covering the arena
    for (let i = 0; i <= steps; i++) {
      const a = aStart + (sweep * i) / steps;
      points.push({
        x: px + Math.cos(a) * outerR,
        y: py + Math.sin(a) * outerR
      });
    }
    // 2. Inner safety perimeter arc hugging the proximity bubble (in reverse)
    for (let i = steps; i >= 0; i--) {
      const a = aStart + (sweep * i) / steps;
      points.push({
        x: px + Math.cos(a) * innerR,
        y: py + Math.sin(a) * innerR
      });
    }

    // Shroud rear blind zone in cyber darkness
    this.graphics.fillStyle(0x020308, 0.94);
    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.graphics.lineTo(points[i].x, points[i].y);
    }
    this.graphics.closePath();
    this.graphics.fillPath();

    // Tactical boundary rays along the edges of the frontal vision cone
    const rayDist = 900;
    const r1 = rot - half;
    const r2 = rot + half;
    this.graphics.lineStyle(1.5, COLORS.cyan, 0.45);
    this.graphics.lineBetween(
      px + Math.cos(r1) * innerR,
      py + Math.sin(r1) * innerR,
      px + Math.cos(r1) * rayDist,
      py + Math.sin(r1) * rayDist
    );
    this.graphics.lineBetween(
      px + Math.cos(r2) * innerR,
      py + Math.sin(r2) * innerR,
      px + Math.cos(r2) * rayDist,
      py + Math.sin(r2) * rayDist
    );

    // Inner proximity boundary arc in subtle warning color
    this.graphics.lineStyle(1.5, 0xff0055, 0.35);
    this.graphics.beginPath();
    this.graphics.arc(px, py, innerR, aStart, aEnd, false);
    this.graphics.strokePath();

    // Soft frontal illumination ambiance
    this.graphics.fillStyle(0x00f0ff, 0.035);
    this.graphics.beginPath();
    this.graphics.moveTo(px, py);
    this.graphics.arc(px, py, 600, r1, r2, false);
    this.graphics.closePath();
    this.graphics.fillPath();
  }

  clear() {
    this.damageAlpha = 0;
    this.hitAlpha = 0;
    this.lowHealth = false;
    this.vignetteDamage.setAlpha(0);
    this.vignetteHit.setAlpha(0);
    this.graphics.clear();
  }

  destroy() {
    this.graphics.destroy();
    this.vignetteDamage.destroy();
    this.vignetteHit.destroy();
  }
}
