export const BUFF_TEMPLATES = [
  {
    id: 'ramming',
    category: 'KINETIC',
    color: '#ff7a00',
    noun: 'RAM',
    buffText: 'Daño por colisión masivo: embestir enemigos los destruye',
    apply: (s) => {
      s.rammingDamage = true;
      s.rammingPower = (s.rammingPower || 1) + 2;
    }
  },
  {
    id: 'impact_nova',
    category: 'KINETIC',
    color: '#ff3366',
    noun: 'SHOCKWAVE',
    buffText: 'Nova cinética: destruir enemigos por colisión emite onda expansiva',
    apply: (s) => {
      s.rammingDamage = true;
      s.impactNova = true;
    }
  },
  {
    id: 'mag_size',
    category: 'BALLISTICS',
    color: '#00ffff',
    noun: 'CHAMBER',
    buffText: '+2 Disparos al cargador por ciclo',
    apply: (s) => {
      s.magazineSize = (s.magazineSize || 3) + 2;
    }
  },
  {
    id: 'fire_rate',
    category: 'WEAPON',
    color: '#39ff14',
    noun: 'TRIGGER',
    buffText: '+35% Cadencia de fuego acelerada',
    apply: (s) => {
      s.fireCdMult = (s.fireCdMult || 1) * 0.65;
    }
  },
  {
    id: 'bullet_speed',
    category: 'ACCELERATOR',
    color: '#00ffff',
    noun: 'VELOCITY',
    buffText: '+45% Velocidad de proyectiles',
    apply: (s) => {
      s.bulletSpeedMult = (s.bulletSpeedMult || 1) * 1.45;
    }
  },
  {
    id: 'shield_boost',
    category: 'DEFENSE',
    color: '#39ff14',
    noun: 'AEGIS',
    buffText: '+1 Escudo máximo adicional',
    apply: (s) => {
      s.maxShields = (s.maxShields || 3) + 1;
    }
  },
  {
    id: 'nanite_repair',
    category: 'DEFENSE',
    color: '#39ff14',
    noun: 'NANITE',
    buffText: 'Auto-reparación: regenera 1 escudo al completar cada oleada',
    apply: (s) => {
      s.naniteRepair = true;
    }
  },
  {
    id: 'emp_retaliation',
    category: 'DEFENSE',
    color: '#ff00ff',
    noun: 'DISCHARGE',
    buffText: 'Descarga reactiva: sufrir daño limpia proyectiles enemigos en pantalla',
    apply: (s) => {
      s.retaliationEmp = true;
    }
  },
  {
    id: 'thruster_boost',
    category: 'PROPULSION',
    color: '#ffdd00',
    noun: 'THRUST',
    buffText: '+30% Velocidad de desplazamiento de nave',
    apply: (s) => {
      s.speedMult = (s.speedMult || 1) * 1.30;
    }
  },
  {
    id: 'magnet_boost',
    category: 'HARVESTER',
    color: '#ff00ff',
    noun: 'VORTEX',
    buffText: '+100px Rango de atracción magnética de suministros',
    apply: (s) => {
      s.magnetRadiusBonus = (s.magnetRadiusBonus || 0) + 100;
    }
  },
  {
    id: 'score_boost',
    category: 'PROTOCOL',
    color: '#ffdd00',
    noun: 'SYNAPSE',
    buffText: '+35% Puntuación base en todos los aciertos',
    apply: (s) => {
      s.scoreMultBonus = (s.scoreMultBonus || 0) + 0.35;
    }
  },
  {
    id: 'stasis_rounds',
    category: 'CONTROL',
    color: '#00e5ff',
    noun: 'STASIS',
    buffText: 'Campo de éxtasis: los impactos ralentizan a los enemigos un 35%',
    apply: (s) => {
      s.stasisRounds = true;
    }
  },
  {
    id: 'burst_mode',
    category: 'BURST',
    color: '#ff7a00',
    noun: 'BURST',
    buffText: 'Modo de fuego: Ráfagas de 3 proyectiles',
    apply: (s) => {
      s.fireMode = 'burst';
    }
  },
  {
    id: 'spread_mode',
    category: 'SHOTGUN',
    color: '#ff7a00',
    noun: 'SPREAD',
    buffText: 'Modo de fuego: Abanico frontal de 3 proyectiles',
    apply: (s) => {
      s.fireMode = 'spread';
    }
  },
  {
    id: 'trivector_mode',
    category: 'MULTIDIR',
    color: '#39ff14',
    noun: 'ARRAY',
    buffText: 'Modo de fuego: Disparo tri-vectorial frontal y lateral',
    apply: (s) => {
      s.fireMode = 'trivector';
    }
  },
  {
    id: 'pierce_mode',
    category: 'PIERCE',
    color: '#00ffff',
    noun: 'RAILGUN',
    buffText: 'Proyectiles de alta energía que penetran enemigos',
    apply: (s) => {
      s.fireMode = 'pierce';
      s.bulletPierce = true;
    }
  },
  {
    id: 'ricochet_rounds',
    category: 'RICOCHET',
    color: '#00ffff',
    noun: 'RICOCHET',
    buffText: 'Proyectiles rebotan 1 vez en paredes y cobertura',
    apply: (s) => {
      s.bulletBounces = 1;
    }
  },
  {
    id: 'glitch_power',
    category: 'CORRUPTION',
    color: '#ff00ff',
    noun: 'CATALYST',
    buffText: 'Puntuación doble y recarga instantánea durante glitches',
    apply: (s) => {
      s.glitchScoreBonus = (s.glitchScoreBonus || 0) + 1;
    }
  }
];

export const DEBUFF_TEMPLATES = [
  {
    id: 'fragile_collision',
    debuffText: 'Vulnerabilidad: Daño por colisión drena 1 escudo extra',
    apply: (s) => {
      s.extraCollisionDamage = true;
    }
  },
  {
    id: 'heavy_inertia',
    debuffText: 'Inercia pesada: Mayor derrape y aceleración reducida',
    apply: (s) => {
      s.heavyInertia = true;
      s.speedMult = (s.speedMult || 1) * 0.9;
    }
  },
  {
    id: 'recoil_kick',
    debuffText: 'Retroceso cinético: Cada disparo empuja tu nave en dirección opuesta',
    apply: (s) => {
      s.recoilKick = true;
    }
  },
  {
    id: 'strict_magazine',
    debuffText: 'Cargador restringido: -1 disparo al cargador por ciclo',
    apply: (s) => {
      s.strictMagazine = true;
      s.magazineSize = Math.max(1, (s.magazineSize || 3) - 1);
    }
  },
  {
    id: 'glitch_frequent',
    debuffText: '+40% Frecuencia de Glitches del sistema',
    apply: (s) => {
      s.glitchFrequencyMult = (s.glitchFrequencyMult || 1) * 1.4;
    }
  },
  {
    id: 'glitch_longer',
    debuffText: 'Los glitches activos duran 4 segundos adicionales',
    apply: (s) => {
      s.glitchDurationBonus = (s.glitchDurationBonus || 0) + 4000;
    }
  },
  {
    id: 'faster_enemies',
    debuffText: '+20% Velocidad de todos los enemigos',
    apply: (s) => {
      s.enemySpeedBonus = (s.enemySpeedBonus || 0) + 0.2;
    }
  },
  {
    id: 'tough_bosses',
    debuffText: 'Los Jefes poseen +30% Puntos de Salud',
    apply: (s) => {
      s.bossHpMult = (s.bossHpMult || 1) * 1.3;
    }
  },
  {
    id: 'spinning_cover',
    debuffText: 'La cobertura central rota al doble de velocidad',
    apply: (s) => {
      s.obstacleSpeedMult = (s.obstacleSpeedMult || 1) * 2.0;
    }
  },
  {
    id: 'tunnel_vision',
    debuffText: 'PUNTO CIEGO: Solo visualizas el cono frontal',
    apply: (s) => {
      s.tunnelVision = true;
    }
  },
  {
    id: 'slow_reload',
    debuffText: '+35% Tiempo de recarga entre ciclos de disparo',
    apply: (s) => {
      s.fireCdMult = (s.fireCdMult || 1) * 1.35;
    }
  },
  {
    id: 'hyper_ebullets',
    debuffText: 'Proyectiles hostiles viajan un +25% más rápido',
    apply: (s) => {
      s.hyperEbullets = true;
    }
  }
];

export const NAME_PREFIXES = [
  'QUANTUM', 'CYBER', 'HYPER', 'VORTEX', 'NEO', 'TITAN', 'KINETIC',
  'CHRONO', 'PLASMA', 'SYNTH', 'OMEGA', 'APEX', 'VECTOR', 'CORRUPTED',
  'ZERO-POINT', 'ASTRAL', 'VOLTAIC', 'NANO'
];

export const NAME_SUFFIXES = [
  'MODULE', 'OVERDRIVE', 'MATRIX', 'CATALYST', 'NODE', 'RELAY',
  'COUPLER', 'GRID', 'REACTOR', 'INJECTOR', 'FRAME', 'CORE', 'CAPACITOR'
];

export function buildDynamicBooster(buff, debuff, rng) {
  const prefix = NAME_PREFIXES[Math.floor(rng() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(rng() * NAME_SUFFIXES.length)];
  const title = `${prefix} ${buff.noun}: ${suffix}`;

  return {
    id: `${buff.id}_${debuff.id}_${Math.floor(rng() * 10000)}`,
    title,
    category: `${buff.category} [TACTICAL]`,
    color: buff.color,
    buff: buff.buffText,
    debuff: debuff.debuffText,
    apply: (stats) => {
      buff.apply(stats);
      debuff.apply(stats);
    }
  };
}

// Pre-defined catalog for legacy test compatibility
export const ALL_BOOSTERS = [
  {
    id: 'burst_fire',
    title: 'BURST PROTOCOL',
    category: 'WEAPON [BURST]',
    color: '#ffdd00',
    buff: '1 clic dispara una ráfaga secuencial de 3 proyectiles',
    debuff: '+30% Tiempo de enfriamiento del cargador',
    apply: (stats) => {
      stats.fireMode = 'burst';
      stats.fireCdMult = (stats.fireCdMult || 1) * 1.25;
    }
  },
  {
    id: 'spread_cannon',
    title: 'SPREAD CANNON',
    category: 'WEAPON [SHOTGUN]',
    color: '#ff7a00',
    buff: '1 clic dispara un abanico frontal de 3 proyectiles',
    debuff: '-15% Velocidad de proyectiles',
    apply: (stats) => {
      stats.fireMode = 'spread';
      stats.bulletSpeedMult = (stats.bulletSpeedMult || 1) * 0.85;
    }
  },
  {
    id: 'trivector_array',
    title: 'TRI-VECTOR ARRAY',
    category: 'WEAPON [MULTIDIR]',
    color: '#39ff14',
    buff: 'Disparo multidireccional: 1 frontal + 2 laterales a 65°',
    debuff: '+20% Velocidad de desplazamiento enemigo',
    apply: (stats) => {
      stats.fireMode = 'trivector';
      stats.enemySpeedBonus = (stats.enemySpeedBonus || 0) + 0.2;
    }
  },
  {
    id: 'piercing_railgun',
    title: 'PIERCING RAILGUN',
    category: 'WEAPON [PIERCE]',
    color: '#00ffff',
    buff: 'Proyectiles de alta energía que penetran enemigos',
    debuff: 'Cargador limitado a 2 disparos por ciclo',
    apply: (stats) => {
      stats.fireMode = 'pierce';
      stats.bulletPierce = true;
      stats.magazineSize = 2;
    }
  },
  {
    id: 'multishot',
    title: 'OVERCLOCKED BLASTER',
    category: 'WEAPON [CAPACITY]',
    color: '#00ffff',
    buff: '+1 Proyectil simultáneo en pantalla',
    debuff: '+40% Frecuencia de Glitches del sistema',
    apply: (stats) => {
      stats.maxBulletsBonus = (stats.maxBulletsBonus || 0) + 1;
      stats.glitchFrequencyMult = (stats.glitchFrequencyMult || 1) * 1.4;
    }
  },
  {
    id: 'titan_armor',
    title: 'TITAN PLATING',
    category: 'DEFENSE',
    color: '#39ff14',
    buff: '+1 Escudo Máximo adicional',
    debuff: '-15% Velocidad de nave y Jefes con +25% HP',
    apply: (stats) => {
      stats.maxShields = (stats.maxShields || 3) + 1;
      stats.speedMult = (stats.speedMult || 1) * 0.85;
      stats.bossHpMult = (stats.bossHpMult || 1) * 1.25;
    }
  }
];

export class BoosterManager {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.stats = {
      fireMode: 'single',
      bulletSpeedMult: 1.0,
      bulletPierce: false,
      magazineSize: 3,
      maxBulletsBonus: 0,
      speedMult: 1.0,
      fireCdMult: 1.0,
      maxShields: 3,
      glitchFrequencyMult: 1.0,
      glitchDurationBonus: 0,
      bossHpMult: 1.0,
      obstacleSpeedMult: 1.0,
      tunnelVision: false,
      doubleBossChance: 0.0,
      bulletBounces: 0,
      enemySpeedBonus: 0,
      scoreMultBonus: 0,
      glitchScoreBonus: 0,
      rammingDamage: false,
      rammingPower: 0,
      impactNova: false,
      naniteRepair: false,
      retaliationEmp: false,
      stasisRounds: false,
      extraCollisionDamage: false,
      heavyInertia: false,
      recoilKick: false,
      strictMagazine: false,
      hyperEbullets: false,
      magnetRadiusBonus: 0
    };
    this.picked = [];
  }

  generateOffer(count = 3) {
    const cards = [];
    const usedBuffs = new Set();
    const usedDebuffs = new Set();

    // Copy available lists
    const buffs = BUFF_TEMPLATES.slice();
    const debuffs = DEBUFF_TEMPLATES.slice();

    // Shuffle lists
    for (let i = buffs.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [buffs[i], buffs[j]] = [buffs[j], buffs[i]];
    }
    for (let i = debuffs.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [debuffs[i], debuffs[j]] = [debuffs[j], debuffs[i]];
    }

    let bIdx = 0;
    let dIdx = 0;

    for (let i = 0; i < count; i++) {
      const b = buffs[bIdx++ % buffs.length];
      const d = debuffs[dIdx++ % debuffs.length];
      cards.push(buildDynamicBooster(b, d, this.rng));
    }

    return cards;
  }

  applyBooster(booster) {
    if (!booster) return;
    this.picked.push(booster.id);
    booster.apply(this.stats);
  }
}
