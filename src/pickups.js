import { CFG, COLORS } from './config.js';

export const FIELD_BOOSTER_BASES = [
  { id: 'ammo', noun: 'MUNICIÓN', color: '#00ffff', texture: 'pickup_ammo', defaultName: 'RECARGA DE MUNICIÓN' },
  { id: 'shield', noun: 'ESCUDO', color: '#39ff14', texture: 'pickup_shield', defaultName: 'REPARACIÓN DE ESCUDO' },
  { id: 'emp', noun: 'EMP', color: '#ff00ff', texture: 'pickup_emp', defaultName: 'PULSO DESTRUCTIVO EMP' },
  { id: 'overdrive', noun: 'SOBREMARCHA', color: '#ff7a00', texture: 'pickup_overdrive', defaultName: 'EMBESTIDA OVERDRIVE' },
  { id: 'score', noun: 'SURGE', color: '#ffdd00', texture: 'pickup_score', defaultName: 'MULTIPLICADOR DE PUNTOS' },
  { id: 'chrono', noun: 'CRONO', color: '#00e5ff', texture: 'pickup_chrono', defaultName: 'ESTASIS TEMPORAL' },
  { id: 'nova', noun: 'NOVA', color: '#ff3366', texture: 'pickup_nova', defaultName: 'DETONACIÓN CINÉTICA' }
];

export const FIELD_BOOSTER_AFFIXES = [
  {
    id: 'standard',
    prefix: '',
    suffix: '',
    weight: 42,
    color: null
  },
  {
    id: 'overcharged',
    prefix: 'SOBRECARGADO',
    suffix: 'VOLTAICO',
    weight: 12,
    color: '#00ffff'
  },
  {
    id: 'quantum',
    prefix: 'CUÁNTICO',
    suffix: 'DE FASE',
    weight: 12,
    color: '#39ff14'
  },
  {
    id: 'volatile',
    prefix: 'VOLÁTIL',
    suffix: 'DETONANTE',
    weight: 10,
    color: '#ff00ff'
  },
  {
    id: 'kinetic',
    prefix: 'CINÉTICO',
    suffix: 'DE IMPACTO',
    weight: 10,
    color: '#ff7a00'
  },
  {
    id: 'vortex',
    prefix: 'VÓRTICE',
    suffix: 'GRAVITATORIO',
    weight: 8,
    color: '#ffdd00'
  },
  {
    id: 'chrono',
    prefix: 'TEMPORAL',
    suffix: 'ÉXTASIS',
    weight: 6,
    color: '#00e5ff'
  }
];

export function buildDynamicFieldBooster(base, affix, rng) {
  let name = base.defaultName;
  if (affix && affix.id !== 'standard') {
    name = `${affix.prefix} ${base.noun}: ${affix.suffix}`;
  }
  return {
    id: `${base.id}_${affix ? affix.id : 'std'}_${Math.floor(rng() * 10000)}`,
    type: base.id,
    affix: affix ? affix.id : 'standard',
    name,
    color: (affix && affix.color) ? affix.color : base.color,
    texture: base.texture
  };
}

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
        booster: null,
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

    let base;
    if (type) {
      base = FIELD_BOOSTER_BASES.find((b) => b.id === type) || FIELD_BOOSTER_BASES[0];
    } else {
      const roll = this.rng();
      if (roll < 0.28) base = FIELD_BOOSTER_BASES[0]; // ammo
      else if (roll < 0.50) base = FIELD_BOOSTER_BASES[1]; // shield
      else if (roll < 0.64) base = FIELD_BOOSTER_BASES[2]; // emp
      else if (roll < 0.76) base = FIELD_BOOSTER_BASES[3]; // overdrive
      else if (roll < 0.86) base = FIELD_BOOSTER_BASES[4]; // score
      else if (roll < 0.94) base = FIELD_BOOSTER_BASES[5]; // chrono
      else base = FIELD_BOOSTER_BASES[6]; // nova
    }

    // Roll affix
    const totalWeight = FIELD_BOOSTER_AFFIXES.reduce((sum, a) => sum + a.weight, 0);
    let r = this.rng() * totalWeight;
    let chosenAffix = FIELD_BOOSTER_AFFIXES[0];
    for (const affix of FIELD_BOOSTER_AFFIXES) {
      if (r < affix.weight) {
        chosenAffix = affix;
        break;
      }
      r -= affix.weight;
    }

    const booster = buildDynamicFieldBooster(base, chosenAffix, this.rng);

    item.active = true;
    item.type = booster.type;
    item.booster = booster;
    item.x = x;
    item.y = y;
    const angle = this.rng() * Math.PI * 2;
    const speed = 20 + this.rng() * 40;
    item.vx = Math.cos(angle) * speed;
    item.vy = Math.sin(angle) * speed;
    item.maxLife = 7500;
    item.life = item.maxLife;

    item.spr.setTexture(booster.texture)
      .setPosition(x, y)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.3);

    if (booster.affix !== 'standard') {
      const tintVal = parseInt(booster.color.replace('#', '0x'), 16);
      item.spr.setTint(tintVal);
    } else {
      item.spr.clearTint();
    }

    this.scene.tweens.add({
      targets: item.spr,
      scale: booster.affix !== 'standard' ? 1.2 : 1.0,
      duration: 250,
      ease: 'Back.out'
    });

    return item;
  }

  update(dt, player, onCollect) {
    const magnetDist = 120 + (player ? (player.magnetRadiusBonus || 0) : 0);
    const pickupRadius = 26;

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
          // Collected! Pass type, x, y, booster
          onCollect(item.type, item.x, item.y, item.booster);
          this.release(item);
          continue;
        } else if (dist <= magnetDist) {
          const pull = (1 - dist / magnetDist) * 340;
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
