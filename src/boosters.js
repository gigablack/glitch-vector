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
    id: 'blindspot',
    title: 'TUNNEL VISION',
    category: 'OPTICS [SPECIAL]',
    color: '#ff00ff',
    buff: '+40% Cadencia de fuego y +25% Puntuación',
    debuff: 'PUNTO CIEGO: Solo visualizas el cono frontal',
    apply: (stats) => {
      stats.fireCdMult = (stats.fireCdMult || 1) * 0.72;
      stats.scoreMultBonus = (stats.scoreMultBonus || 0) + 0.25;
      stats.tunnelVision = true;
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
  },
  {
    id: 'warp_engine',
    title: 'HYPER THRUSTERS',
    category: 'PROPULSION',
    color: '#ffdd00',
    buff: '+35% Velocidad de movimiento',
    debuff: 'La cobertura central rota al doble de velocidad',
    apply: (stats) => {
      stats.speedMult = (stats.speedMult || 1) * 1.35;
      stats.obstacleSpeedMult = (stats.obstacleSpeedMult || 1) * 2.0;
    }
  },
  {
    id: 'glitch_catalyst',
    title: 'GLITCH HARVESTER',
    category: 'RISK/REWARD',
    color: '#ff7a00',
    buff: 'Duplica puntuación durante glitches activos',
    debuff: 'Los glitches duran 4 segundos más',
    apply: (stats) => {
      stats.glitchScoreBonus = (stats.glitchScoreBonus || 0) + 1;
      stats.glitchDurationBonus = (stats.glitchDurationBonus || 0) + 4000;
      stats.doubleBossChance = (stats.doubleBossChance || 0) + 0.25;
    }
  },
  {
    id: 'bouncing_plasma',
    title: 'RICOCHET ROUNDS',
    category: 'BALLISTICS',
    color: '#00ffff',
    buff: 'Balas rebotan 1 vez en paredes y cobertura',
    debuff: 'Balas enemigas viajan un 20% más rápido',
    apply: (stats) => {
      stats.bulletBounces = 1;
      stats.enemySpeedBonus = (stats.enemySpeedBonus || 0) + 0.2;
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
      glitchScoreBonus: 0
    };
    this.picked = [];
  }

  generateOffer(count = 3) {
    const pool = ALL_BOOSTERS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, count);
  }

  applyBooster(booster) {
    if (!booster) return;
    this.picked.push(booster.id);
    booster.apply(this.stats);
  }
}
