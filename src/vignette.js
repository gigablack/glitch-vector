import { CFG, COLORS } from './config.js';

export class VignetteSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageAlpha = 0;
    this.hitAlpha = 0;
    this.tunnelVision = false;
    this.lowHealth = false;
    this.pulseTime = 0;

    // Graphics overlay layer (between gameplay and HUD)
    this.graphics = scene.add.graphics()
      .setDepth(92)
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
    const coneAngle = (95 * Math.PI) / 180;
    const coneDist = 720;
    const half = coneAngle / 2;

    this.graphics.fillStyle(0x020205, 0.94);
    // Draw full screen mask then cut out cone with clear or sector
    // We can draw a polygon around the vision cone
    const a1 = rot - half;
    const a2 = rot + half;

    const p1x = px + Math.cos(a1) * coneDist;
    const p1y = py + Math.sin(a1) * coneDist;
    const p2x = px + Math.cos(a2) * coneDist;
    const p2y = py + Math.sin(a2) * coneDist;

    // Outer polygon surrounding screen except the forward cone
    // To keep it simple and performant, draw black overlay with arc cutout or 4 perimeter quads
    this.graphics.beginPath();
    this.graphics.moveTo(0, 0);
    this.graphics.lineTo(CFG.W, 0);
    this.graphics.lineTo(CFG.W, CFG.H);
    this.graphics.lineTo(0, CFG.H);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Subtle flashlight illumination in cone
    this.graphics.fillStyle(0x000000, 1);
    // Erase or light up: Phaser graphics doesn't do blend ERASE out of the box easily,
    // so we render the sector as a soft cyan ambient spotlight
    this.graphics.lineStyle(2, COLORS.cyan, 0.25);
    this.graphics.lineBetween(px, py, p1x, p1y);
    this.graphics.lineBetween(px, py, p2x, p2y);
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
