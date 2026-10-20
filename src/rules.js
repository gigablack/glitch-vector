import { CFG, ENEMY_DEFS, GLITCH_TYPES } from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function pick(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

export function waveCount(wave) {
  return 4 + wave * 2;
}

export function unlockedTypes(wave) {
  return Object.keys(ENEMY_DEFS).filter((type) => {
    const def = ENEMY_DEFS[type];
    return type !== 'boss' && type !== 'mini' && def.unlock <= wave;
  });
}

export function buildWave(wave, rng) {
  const boss = wave % 5 === 0;
  const total = boss ? Math.floor(waveCount(wave) / 2) : waveCount(wave);
  const unlocked = unlockedTypes(wave);
  const types = [];
  const guarantee = Math.min(unlocked.length, total);
  for (let i = 0; i < guarantee; i++) types.push(unlocked[i]);
  while (types.length < total) types.push(pick(unlocked, rng));
  shuffle(types, rng);
  return { boss, types };
}

export function generateSequence(candidates, rng, length = 3) {
  if (!candidates.length) return [];
  const seq = [];
  for (let i = 0; i < length; i++) seq.push(pick(candidates, rng));
  return seq;
}

export function repairSequence(sequence, candidates, rng) {
  if (!candidates.length) return [];
  return sequence.map((type) => (candidates.includes(type) ? type : pick(candidates, rng)));
}

export function glitchInterval(wave) {
  return Math.max(CFG.GLITCH.minInterval, 30000 - (wave - 1) * 1500);
}

export function pickGlitchType(lastType, types = GLITCH_TYPES, rng) {
  const pool = types.filter((type) => type !== lastType);
  return pick(pool.length ? pool : types, rng);
}

export function scoreKill({ base, multiplier, correct, glitch, isBoss, wave }) {
  const glitchMult = glitch ? 2 : 1;
  if (isBoss) {
    return {
      points: (2000 + 500 * wave) * glitchMult,
      multiplier
    };
  }
  if (correct) {
    const next = Math.min(CFG.MULT_MAX, multiplier + 1);
    return { points: base * next * glitchMult, multiplier: next };
  }
  return { points: base * glitchMult, multiplier: 1 };
}

export function reflectAABB(x, y, vx, vy, radius, rect) {
  const right = rect.x + rect.w;
  const bottom = rect.y + rect.h;
  const closestX = clamp(x, rect.x, right);
  const closestY = clamp(y, rect.y, bottom);
  const dx = x - closestX;
  const dy = y - closestY;
  const d2 = dx * dx + dy * dy;

  if (d2 > radius * radius) {
    return { x, y, vx, vy, axis: null, hit: false };
  }

  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    const nx = dx / d;
    const ny = dy / d;
    const dot = vx * nx + vy * ny;
    if (dot < 0) {
      vx -= 2 * dot * nx;
      vy -= 2 * dot * ny;
    }
    return {
      x: closestX + nx * (radius + 0.01),
      y: closestY + ny * (radius + 0.01),
      vx, vy,
      axis: Math.abs(nx) > Math.abs(ny) ? 'x' : 'y',
      hit: true
    };
  }

  const pl = x - rect.x;
  const pr = right - x;
  const pt = y - rect.y;
  const pb = bottom - y;
  const min = Math.min(pl, pr, pt, pb);

  if (min === pl || min === pr) {
    const goRight = min === pr || (pl === pr && vx > 0);
    return goRight
      ? { x: right + radius + 0.01, y, vx: Math.abs(vx), vy, axis: 'x', hit: true }
      : { x: rect.x - radius - 0.01, y, vx: -Math.abs(vx), vy, axis: 'x', hit: true };
  }
  const goDown = min === pb || (pt === pb && vy > 0);
  return goDown
    ? { x, y: bottom + radius + 0.01, vx, vy: Math.abs(vy), axis: 'y', hit: true }
    : { x, y: rect.y - radius - 0.01, vx, vy: -Math.abs(vy), axis: 'y', hit: true };
}

export function segDist2(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (!len2) {
    const ex = px - x1;
    const ey = py - y1;
    return ex * ex + ey * ey;
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  const ex = px - (x1 + t * dx);
  const ey = py - (y1 + t * dy);
  return ex * ex + ey * ey;
}

export function hitsRect(x, y, radius, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

export function formatScore(value, digits = 7) {
  const text = String(Math.max(0, Math.floor(value)));
  return text.length >= digits ? text : text.padStart(digits, '0');
}

export function enemySpeed(type, wave) {
  const def = ENEMY_DEFS[type];
  return Math.min(def.cap, def.speed + (wave - 1) * def.step);
}
