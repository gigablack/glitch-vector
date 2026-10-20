import { CFG, COLORS, UI, readBest, writeBest } from './config.js';
import {
  buildWave, mulberry32, scoreKill, segDist2
} from './rules.js';
import { createTextures } from './textures.js';
import { getAudio } from './audio.js';
import { Player } from './player.js';
import { BulletPool } from './bullets.js';
import { EnemyBulletPool } from './enemyBullets.js';
import { EnemyManager } from './enemies.js';
import { TargetSequence } from './waves.js';
import { GlitchDirector } from './glitch.js';
import { FxSystem } from './fx.js';
import { Hud } from './ui.js';

function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = parseInt(params.get('seed') || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : (Date.now() >>> 0);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createTextures(this);
    this.scene.start('Menu');
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.started = false;
    this.grid = this.add.tileSprite(640, 360, 1280, 720, 'grid')
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.grid2 = this.add.tileSprite(640, 360, 1280, 720, 'grid2')
      .setAlpha(0.4)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.add.text(640, 206, UI.title, {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2
    }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 18, true, true);

    this.add.text(640, 264, UI.subtitle, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff00ff',
      letterSpacing: 6
    }).setOrigin(0.5);

    this.add.text(640, 342,
      'WASD / ARROWS  MOVE\nMOUSE  AIM\nCLICK / SPACE  FIRE\nP / ESC  PAUSE     M  MUTE',
      {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#7fffff',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5);

    this.bestText = this.add.text(640, 438, `${UI.best} ${String(readBest()).padStart(7, '0')}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.prompt = this.add.text(640, 512, UI.start, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#39ff14'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.input.on('pointerdown', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
    this.input.keyboard.on('keydown-ENTER', () => this.start());

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart')) this.time.delayedCall(450, () => this.start());
  }

  update(time, delta) {
    this.grid.tilePositionY -= delta * 0.01;
    this.grid2.tilePositionY += delta * 0.006;
    this.grid.tilePositionX += delta * 0.003;
  }

  start() {
    if (this.started) return;
    this.started = true;
    const audio = getAudio();
    if (audio.init()) audio.startMusic();
    this.scene.start('Game');
  }
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.bus = this.game.events;
    this.audio = getAudio();
    this.seed = seedFromUrl();
    this.rng = mulberry32(this.seed);
    this.cameras.main.setBackgroundColor('#000000');

    this.fx = new FxSystem(this, this.rng);
    this.enemies = new EnemyManager(this, this.rng);
    this.bullets = new BulletPool(this);
    this.ebullets = new EnemyBulletPool(this);
    this.player = new Player(this);
    this.sequence = new TargetSequence(this.rng);
    this.glitch = new GlitchDirector(this, this.audio, this.rng);

    this.cube = this.add.image(CFG.CUBE.cx, CFG.CUBE.cy, 'cube')
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.9);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
    this.firing = false;
    this.paused = false;
    this.over = false;
    this.dead = false;
    this.deathTimer = 0;
    this.waveTimer = 0;
    this.breakTimer = 0;
    this.spawnAccum = 0;
    this.spawnQueue = [];
    this.wavePlan = { boss: false, types: [] };
    this.hudTimer = 0;
    this.fireLockUntil = 0;
    this.inputState = { x: 0, y: 0 };

    this.input.on('pointerdown', () => {
      if (this.paused || this.over || this.dead) return;
      this.firing = true;
      this.tryFire();
    });
    this.input.on('pointerup', () => {
      this.firing = false;
    });

    this.bus.on('pause:toggle', this.togglePause, this);
    this.bus.on('run:restart', this.restartRun, this);
    this.events.once('shutdown', () => {
      this.bus.off('pause:toggle', this.togglePause, this);
      this.bus.off('run:restart', this.restartRun, this);
    });

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.best = readBest();
    this.wave = 1;
    this.mult = 1;
    this.phase = 'intro';
    this.paused = false;
    this.dead = false;
    this.over = false;
    this.deathTimer = 0;
    this.waveTimer = 0;
    this.breakTimer = 0;
    this.spawnAccum = 0;
    this.spawnQueue = [];
    this.hudTimer = 0;
    this.firing = false;
    this.fireLockUntil = this.time.now + 250;

    this.player.reset();
    this.bullets.clear();
    this.ebullets.clear();
    this.enemies.clear();
    this.fx.clear();
    this.glitch.reset();
    this.sequence.clear();
    this.cube.setScale(1).setAlpha(0.9);

    this.audio.setPaused(false);
    this.audio.setGlitch(false);
    this.audio.setBreak(false);
    this.audio.startMusic();

    this.bus.emit('run:start');
    this.bus.emit('pause:changed', { paused: false });
    this.startWave();
    this.syncAll();
  }

  restartRun() {
    this.resetRun();
  }

  startWave() {
    this.phase = 'intro';
    this.waveTimer = 0;
    this.breakTimer = 0;
    this.spawnAccum = 0;
    this.enemies.clear();
    this.bullets.clear();
    this.ebullets.clear();
    this.glitch.forceEnd();
    this.sequence.clear();

    this.wavePlan = buildWave(this.wave, this.rng);
    this.spawnQueue = this.wavePlan.types.slice();
    this.sequence.setCandidates(this.getCandidates());

    this.audio.setWave(this.wave);
    this.audio.setBreak(false);
    this.bus.emit('wave:intro', { wave: this.wave });
    this.syncSequence();
    this.syncHud();
  }

  getCandidates() {
    const types = this.enemies.getActiveTypes();
    for (const type of this.spawnQueue) types.push(type);
    return this.sequence.clean(types);
  }

  update(time, delta) {
    if (this.paused) return;
    const dt = Math.min(delta, 50) / 1000;
    this.fx.update(dt, this.glitch.disorient, time);

    if (this.over) return;

    if (this.dead) {
      this.deathTimer += delta;
      if (this.deathTimer >= CFG.DEATH) {
        this.over = true;
        this.phase = 'gameover';
        this.bus.emit('run:over', {
          score: this.score,
          wave: this.wave,
          best: this.best
        });
      }
      return;
    }

    const pointer = this.input.activePointer;
    const aimX = pointer.worldX || this.player.x + 100;
    const aimY = pointer.worldY || this.player.y;
    this.player.update(dt, this.getInput(), aimX, aimY);

    if (this.phase === 'intro') {
      this.waveTimer += delta;
      if (this.waveTimer >= CFG.WAVE.intro) {
        this.phase = 'active';
        this.spawnAccum = 0;
        if (this.wavePlan.boss) {
          this.enemies.spawnBoss(this.wave, time);
          this.audio.sfx('boss');
          this.fx.shake(0.008, 300);
        }
        this.audio.sfx('wave');
        this.syncHud();
      }
    } else if (this.phase === 'active') {
      this.glitch.update(delta, this.wave, true);
      this.updateFiring();
      this.spawnEnemies(time, delta);
      this.bullets.update(dt, CFG.CUBE, CFG.PLAY);
      this.enemies.update(
        dt, time, this.player, this.glitch.speedMult, CFG.CUBE,
        (x, y, vx, vy, kind) => this.ebullets.spawn(x, y, vx, vy, kind),
        this.wave
      );
      this.ebullets.update(dt, CFG.PLAY, CFG.CUBE);
      this.collide();
      this.checkWaveClear();
      this.updateTelegraph();
    } else if (this.phase === 'break') {
      this.breakTimer += delta;
      if (this.breakTimer >= CFG.WAVE.break) {
        this.wave += 1;
        this.startWave();
      }
    }

    this.pulseCube();
    this.hudTimer += delta;
    if (this.hudTimer >= 100) {
      this.hudTimer = 0;
      this.syncHud();
    }
  }

  getInput() {
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (k.A.isDown || k.LEFT.isDown) x -= 1;
    if (k.D.isDown || k.RIGHT.isDown) x += 1;
    if (k.W.isDown || k.UP.isDown) y -= 1;
    if (k.S.isDown || k.DOWN.isDown) y += 1;
    if (this.glitch.invert) {
      x = -x;
      y = -y;
    }
    this.inputState.x = x;
    this.inputState.y = y;
    return this.inputState;
  }

  updateFiring() {
    if (this.firing || this.keys.SPACE.isDown) this.tryFire();
  }

  tryFire() {
    if (this.paused || this.over || this.dead || this.time.now < this.fireLockUntil) return;
    const active = this.bullets.activeCount();
    if (this.player.canFire(active)) {
      const angle = this.player.spr.rotation;
      if (this.bullets.spawn(this.player.muzzleX, this.player.muzzleY, angle)) {
        this.player.markFired();
        this.audio.sfx('shoot');
        this.fx.burst(this.player.muzzleX, this.player.muzzleY, COLORS.cyan, 2);
      }
    } else if (active >= CFG.PLAYER.maxBullets && this.player.fireCd <= 0) {
      this.player.fireCd = 150;
      this.audio.sfx('dry');
      this.bus.emit('ammo:empty');
    }
  }

  spawnEnemies(time, delta) {
    this.spawnAccum += delta;
    while (this.spawnAccum >= CFG.WAVE.spawnStagger && this.spawnQueue.length) {
      this.spawnAccum -= CFG.WAVE.spawnStagger;
      const type = this.spawnQueue.shift();
      this.enemies.spawnAtEdge(type, this.player, this.wave, time);
      this.sequence.setCandidates(this.getCandidates());
      this.syncSequence();
    }
  }

  collide() {
    const player = this.player;
    this.bullets.forEach((bullet) => {
      if (!bullet.active) return;
      const bx = bullet.spr.x;
      const by = bullet.spr.y;
      const px = bullet.prevX ?? bx;
      const py = bullet.prevY ?? by;

      const boss = this.enemies.boss;
      if (boss && segDist2(boss.spr.x, boss.spr.y, px, py, bx, by) < (boss.r + CFG.BULLET.r) ** 2) {
        this.bullets.release(bullet);
        this.hitBoss();
        return;
      }

      this.enemies.forEachActive((enemy) => {
        if (!bullet.active) return;
        if (segDist2(enemy.spr.x, enemy.spr.y, px, py, bx, by) < (enemy.r + CFG.BULLET.r) ** 2) {
          this.bullets.release(bullet);
          this.hitEnemy(enemy, true);
        }
      });
    });

    this.enemies.forEachActive((enemy) => {
      if (this.dead) return;
      const px = enemy.prevX ?? enemy.spr.x;
      const py = enemy.prevY ?? enemy.spr.y;
      if (segDist2(player.x, player.y, px, py, enemy.spr.x, enemy.spr.y) <
          (enemy.r + CFG.PLAYER.hitR) ** 2) {
        if (player.damage()) this.onPlayerHit();
        this.killEnemy(enemy, false);
      }
    });

    const boss = this.enemies.boss;
    if (boss && !this.dead) {
      const dx = player.x - boss.spr.x;
      const dy = player.y - boss.spr.y;
      if (dx * dx + dy * dy < (boss.r + CFG.PLAYER.hitR) ** 2) {
        if (player.damage()) this.onPlayerHit();
      }
    }

    this.ebullets.forEach((bullet) => {
      if (this.dead) return;
      const px = bullet.prevX ?? bullet.spr.x;
      const py = bullet.prevY ?? bullet.spr.y;
      if (segDist2(player.x, player.y, px, py, bullet.spr.x, bullet.spr.y) <
          (bullet.r + CFG.PLAYER.hitR) ** 2) {
        this.ebullets.release(bullet);
        if (player.damage()) this.onPlayerHit();
      }
    });
  }

  hitEnemy(enemy, byPlayer) {
    enemy.hp -= 1;
    enemy.flashUntil = this.time.now + 60;
    enemy.spr.setTint(0xffffff);
    this.audio.sfx('hit');
    this.fx.burst(enemy.spr.x, enemy.spr.y, enemy.def.color, 4);
    if (enemy.hp <= 0) this.killEnemy(enemy, byPlayer);
  }

  killEnemy(enemy, byPlayer) {
    const type = enemy.type;
    const def = enemy.def;
    const x = enemy.spr.x;
    const y = enemy.spr.y;
    const vx = enemy.vx;
    const vy = enemy.vy;
    this.enemies.release(enemy);
    this.fx.burst(x, y, def.color, type === 'tank' ? 24 : 12);
    this.audio.sfx('explosion');

    if (byPlayer && type === 'splitter') {
      const speed = Math.min(420, 220 + (this.wave - 1) * 10);
      const base = Math.atan2(vy, vx);
      this.enemies.spawn('mini', x, y, Math.cos(base + Math.PI / 2) * speed,
        Math.sin(base + Math.PI / 2) * speed, this.wave, this.time.now);
      this.enemies.spawn('mini', x, y, Math.cos(base - Math.PI / 2) * speed,
        Math.sin(base - Math.PI / 2) * speed, this.wave, this.time.now);
    }

    if (byPlayer) this.awardKill(type, def.score, x, y);
    this.sequence.setCandidates(this.getCandidates());
    this.syncSequence();
  }

  awardKill(type, base, x, y) {
    const glitchMult = this.glitch.scoreMult;
    const hasSequence = this.sequence.queue.length > 0;
    let points;
    let correct = false;

    if (!hasSequence) {
      points = base * glitchMult;
      this.fx.text(x, y, `+${points}`, '#ffffff');
    } else {
      correct = this.sequence.matches(type);
      const result = scoreKill({
        base,
        multiplier: this.mult,
        correct,
        glitch: glitchMult > 1,
        isBoss: false,
        wave: this.wave
      });
      points = result.points;
      this.mult = result.multiplier;

      if (correct) {
        this.sequence.correct(this.getCandidates());
        this.fx.text(x, y, `+${points}`, '#39ff14');
        this.audio.sfx('combo');
        this.bus.emit('sequence:hit');
      } else {
        this.sequence.wrong(this.getCandidates());
        this.fx.text(x, y, `+${points}`, '#ff3355');
        this.audio.sfx('dry');
        this.bus.emit('sequence:lost');
      }
    }

    this.score += points;
    if (this.score > this.best) {
      this.best = this.score;
      writeBest(this.best);
    }
    this.bus.emit('sequence:update', { queue: [...this.sequence.queue] });
    this.syncHud();
  }

  hitBoss() {
    const boss = this.enemies.boss;
    if (!boss) return;
    boss.hp -= 1;
    boss.flashUntil = this.time.now + 60;
    boss.spr.setTint(0xffffff);
    this.audio.sfx('hit');
    this.fx.burst(boss.spr.x, boss.spr.y, COLORS.magenta, 4);
    if (boss.hp <= 0) this.killBoss();
    else this.syncHud();
  }

  killBoss() {
    const boss = this.enemies.boss;
    if (!boss) return;
    const x = boss.spr.x;
    const y = boss.spr.y;
    const points = scoreKill({
      base: 0,
      multiplier: this.mult,
      correct: false,
      glitch: this.glitch.scoreMult > 1,
      isBoss: true,
      wave: this.wave
    }).points;
    this.enemies.killBoss();
    this.ebullets.clear();
    this.score += points;
    if (this.score > this.best) {
      this.best = this.score;
      writeBest(this.best);
    }
    this.fx.burst(x, y, COLORS.magenta, 80);
    this.fx.burst(x, y, COLORS.cyan, 40);
    this.fx.shake(0.02, 600);
    this.fx.text(x, y, `+${points}`, '#ff00ff');
    this.audio.sfx('explosion');
    this.syncHud();
  }

  onPlayerHit() {
    this.fx.shake(0.006, 150);
    this.fx.flash(255, 0, 0, 120);
    this.audio.sfx('shield');
    this.syncHud();
    if (this.player.dead) this.beginDeath();
  }

  beginDeath() {
    this.dead = true;
    this.deathTimer = 0;
    this.firing = false;
    this.glitch.forceEnd();
    this.fx.burst(this.player.x, this.player.y, COLORS.danger, 40);
    this.fx.shake(0.02, 500);
    this.audio.gameOver();
    this.bus.emit('player:dead');
    this.syncHud();
  }

  checkWaveClear() {
    if (this.dead || this.phase !== 'active') return;
    if (this.spawnQueue.length || this.enemies.countActive() || this.enemies.boss) return;
    this.phase = 'break';
    this.breakTimer = 0;
    const bonus = CFG.WAVE_BONUS * this.wave;
    this.score += bonus;
    if (this.score > this.best) {
      this.best = this.score;
      writeBest(this.best);
    }
    this.glitch.forceEnd();
    this.bullets.clear();
    this.ebullets.clear();
    this.audio.setBreak(true);
    this.audio.sfx('wave');
    this.bus.emit('wave:clear', { wave: this.wave, bonus });
    this.syncHud();
  }

  updateTelegraph() {
    this.fx.clearLine();
    const boss = this.enemies.boss;
    if (boss && boss.pending) {
      this.fx.line(boss.spr.x, boss.spr.y, this.player.x, this.player.y, COLORS.magenta, 0.5);
    }
    this.enemies.forEachActive((enemy) => {
      if (enemy.telegraph) {
        this.fx.line(enemy.spr.x, enemy.spr.y, this.player.x, this.player.y, COLORS.danger, 0.4);
      }
    });
  }

  pulseCube() {
    if (this.glitch.active === 'overclock') this.cube.setTint(COLORS.magenta);
    else this.cube.clearTint();
    if (!this.audio.pollBeat()) return;
    this.cube.setScale(1.06);
    this.tweens.add({
      targets: this.cube,
      scale: 1,
      duration: 120,
      ease: 'Sine.out'
    });
  }

  togglePause() {
    if (this.over || this.dead) return;
    this.paused = !this.paused;
    this.firing = false;
    this.audio.setPaused(this.paused);
    this.bus.emit('pause:changed', { paused: this.paused });
  }

  syncHud() {
    const boss = this.enemies.boss;
    this.bus.emit('hud:update', {
      score: this.score,
      best: this.best,
      wave: this.wave,
      shields: this.player.shields,
      mult: this.mult,
      bullets: this.bullets.activeCount(),
      bossHp: boss ? Math.max(0, boss.hp) : 0,
      bossMax: boss ? boss.maxHp : 0
    });
  }

  syncSequence() {
    this.bus.emit('sequence:update', { queue: [...this.sequence.queue] });
  }

  syncAll() {
    this.syncHud();
    this.syncSequence();
    this.bus.emit('audio:state', {
      muted: this.audio.muted,
      available: !!this.audio.ctx
    });
    this.bus.emit('pause:changed', { paused: this.paused });
  }

}

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.hud = new Hud(this);
    this.gameScene = this.scene.get('Game');
    this.audio = getAudio();
    this.hud.setAudio(this.audio.muted, !!this.audio.ctx);

    this.handlers = {
      'hud:update': (data) => this.hud.updateHud(data),
      'sequence:update': (data) => this.hud.setSequence(data.queue),
      'sequence:hit': () => this.hud.sequenceHit(),
      'sequence:lost': () => this.hud.sequenceLost(),
      'wave:intro': (data) => this.hud.waveIntro(data.wave),
      'wave:clear': (data) => this.hud.waveClear(data.bonus),
      'glitch:start': (data) => this.hud.glitchStart(data.type),
      'glitch:end': () => this.hud.glitchEnd(),
      'pause:changed': (data) => this.hud.pause(data.paused),
      'run:over': (data) => this.hud.gameOver(data),
      'run:start': () => this.hud.restart(),
      'audio:state': (data) => this.hud.setAudio(data.muted, data.available)
    };
    for (const [name, handler] of Object.entries(this.handlers)) {
      this.game.events.on(name, handler);
    }

    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => this.toggleMute());
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameScene && this.gameScene.over) this.restart();
    });
    this.input.on('pointerdown', () => {
      if (this.gameScene && this.gameScene.over) this.restart();
    });

    this.visibilityHandler = () => {
      if (document.hidden && this.gameScene && !this.gameScene.over && !this.gameScene.paused) {
        this.game.events.emit('pause:toggle');
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.events.once('shutdown', () => {
      for (const [name, handler] of Object.entries(this.handlers)) {
        this.game.events.off(name, handler);
      }
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    });

    if (this.gameScene && this.gameScene.syncAll) this.gameScene.syncAll();
  }

  togglePause() {
    this.game.events.emit('pause:toggle');
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.hud.setAudio(muted, !!this.audio.ctx);
    this.game.events.emit('audio:state', { muted, available: !!this.audio.ctx });
  }

  restart() {
    this.game.events.emit('run:restart');
  }
}
