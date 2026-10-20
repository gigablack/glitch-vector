export const CFG = {
  W: 1280,
  H: 720,
  PLAY: { x: 16, y: 88, w: 1248, h: 616 },
  CUBE: { x: 570, y: 326, w: 140, h: 140, cx: 640, cy: 396 },
  PLAYER: {
    x: 640, y: 600, r: 11, hitR: 9, speed: 280, tau: 60,
    shields: 3, invuln: 1500, fireCd: 220, maxBullets: 3
  },
  BULLET: { speed: 520, r: 3, life: 6000 },
  WAVE: { intro: 1200, break: 3000, spawnStagger: 140, safeDist: 180 },
  GLITCH: { duration: 8000, minInterval: 15000 },
  MULT_MAX: 8,
  WAVE_BONUS: 1000,
  DEATH: 900
};

export const COLORS = {
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  green: 0x39ff14,
  orange: 0xff7a00,
  white: 0xffffff,
  yellow: 0xffdd00,
  danger: 0xff3355
};

export const ENEMY_DEFS = {
  bouncer: {
    texture: 'bouncer', hp: 1, r: 12, speed: 130, step: 15, cap: 400,
    score: 100, unlock: 1, color: COLORS.cyan, seq: 'bouncer'
  },
  chaser: {
    texture: 'chaser', hp: 1, r: 14, speed: 85, step: 15, cap: 300,
    score: 100, unlock: 4, color: COLORS.magenta, seq: 'chaser'
  },
  tank: {
    texture: 'tank', hp: 3, r: 20, speed: 55, step: 12, cap: 220,
    score: 100, unlock: 7, color: COLORS.orange, seq: 'tank'
  },
  splitter: {
    texture: 'splitter', hp: 1, r: 14, speed: 160, step: 18, cap: 420,
    score: 100, unlock: 10, color: COLORS.green, seq: 'splitter'
  },
  sniper: {
    texture: 'sniper', hp: 1, r: 14, speed: 0, step: 0, cap: 0,
    score: 100, unlock: 13, color: COLORS.yellow, seq: 'sniper'
  },
  mini: {
    texture: 'mini', hp: 1, r: 8, speed: 220, step: 10, cap: 420,
    score: 50, unlock: 99, color: COLORS.cyan, seq: 'bouncer'
  },
  boss: {
    texture: 'boss', hp: 0, r: 70, speed: 60, step: 0, cap: 0,
    score: 0, unlock: 5, color: COLORS.magenta, seq: 'boss'
  }
};

export const POOLS = {
  bouncer: 64,
  chaser: 32,
  tank: 16,
  splitter: 24,
  sniper: 4,
  mini: 48,
  playerBullets: 3,
  enemyBullets: 80,
  particles: 300,
  texts: 24
};

export const GLITCH_TYPES = ['invert', 'overclock', 'disorient'];

export const UI = {
  title: 'GLITCH//VECTOR',
  subtitle: 'ARENA PROTOCOL',
  start: 'CLICK TO START',
  score: 'SCORE',
  best: 'BEST',
  wave: 'WAVE',
  target: 'TARGET',
  shields: 'SHIELDS',
  paused: 'PAUSED',
  resume: 'P TO RESUME',
  gameOver: 'GAME OVER',
  restart: 'CLICK TO RESTART',
  waveClear: 'WAVE CLEAR',
  invert: 'GLITCH: INVERT',
  overclock: 'GLITCH: OVERCLOCK',
  disorient: 'GLITCH: DISORIENT',
  restored: 'SYSTEM RESTORED',
  lost: 'SEQUENCE LOST',
  soundOff: 'SOUND OFF',
  soundOn: 'SOUND ON',
  audioOff: 'AUDIO OFF'
};

export const STORAGE = {
  best: 'gv_best',
  muted: 'gv_muted'
};

export function readBest() {
  try {
    return parseInt(window.localStorage.getItem(STORAGE.best) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function writeBest(value) {
  try {
    window.localStorage.setItem(STORAGE.best, String(Math.max(0, Math.floor(value))));
  } catch {
    /* in-memory fallback */
  }
}

export function readMuted() {
  try {
    return window.localStorage.getItem(STORAGE.muted) === '1';
  } catch {
    return false;
  }
}

export function writeMuted(value) {
  try {
    window.localStorage.setItem(STORAGE.muted, value ? '1' : '0');
  } catch {
    /* in-memory fallback */
  }
}
