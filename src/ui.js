import { CFG, ENEMY_DEFS, COLORS, UI } from './config.js';
import { formatScore } from './rules.js';

const CSS = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  green: '#39ff14',
  orange: '#ff7a00',
  white: '#ffffff',
  red: '#ff3355',
  dim: '#7fffff'
};

function style(size, color = CSS.white) {
  return {
    fontFamily: 'monospace',
    fontSize: `${size}px`,
    color,
    stroke: '#000000',
    strokeThickness: 3
  };
}

export class Hud {
  constructor(scene) {
    this.scene = scene;
    this.last = {};
    this.bannerToken = 0;

    this.scoreLabel = scene.add.text(24, 12, UI.score, style(10, CSS.cyan)).setDepth(50);
    this.scoreText = scene.add.text(24, 26, '0000000', style(22, CSS.white)).setDepth(50);
    this.bestText = scene.add.text(24, 54, `${UI.best} 0000000`, style(10, CSS.dim)).setDepth(50);

    this.waveText = scene.add.text(640, 10, `${UI.wave} 01`, style(18, CSS.cyan))
      .setOrigin(0.5, 0).setDepth(50);
    this.targetLabel = scene.add.text(640, 38, UI.target, style(9, CSS.magenta))
      .setOrigin(0.5, 0).setDepth(50);
    this.icons = [];
    for (let i = 0; i < 3; i++) {
      this.icons.push(scene.add.image(596 + i * 44, 64, 'bouncer')
        .setOrigin(0.5)
        .setDepth(50)
        .setScale(i === 0 ? 0.92 : 0.68)
        .setAlpha(i === 0 ? 1 : 0.55)
        .setVisible(false));
    }

    this.shieldLabel = scene.add.text(1256, 10, UI.shields, style(9, CSS.cyan))
      .setOrigin(1, 0).setDepth(50);
    this.shields = [];
    for (let i = 0; i < CFG.PLAYER.shields; i++) {
      this.shields.push(scene.add.image(1256 - i * 26, 38, 'player')
        .setOrigin(0.5)
        .setRotation(-Math.PI / 2)
        .setScale(0.68)
        .setTint(COLORS.cyan)
        .setDepth(50));
    }
    this.multText = scene.add.text(1256, 54, 'x1', style(14, CSS.magenta))
      .setOrigin(1, 0).setDepth(50);
    this.ammoText = scene.add.text(1256, 70, 'AMMO 3', style(9, CSS.dim))
      .setOrigin(1, 0).setDepth(50);
    this.soundText = scene.add.text(24, 70, UI.soundOn, style(9, CSS.dim)).setDepth(50);

    this.bossBar = scene.add.graphics().setDepth(50).setVisible(false);

    this.glitchBanner = scene.add.text(640, 132, '', style(26, CSS.magenta))
      .setOrigin(0.5).setDepth(51).setVisible(false);
    this.waveBanner = scene.add.text(640, 322, '', style(46, CSS.cyan))
      .setOrigin(0.5).setDepth(51).setVisible(false);
    this.clearBanner = scene.add.text(640, 392, '', style(22, CSS.green))
      .setOrigin(0.5).setDepth(51).setVisible(false);
    this.lostText = scene.add.text(640, 180, UI.lost, style(16, CSS.red))
      .setOrigin(0.5).setDepth(51).setVisible(false);
    this.restoredText = scene.add.text(640, 164, UI.restored, style(17, CSS.green))
      .setOrigin(0.5).setDepth(51).setVisible(false);

    this.controls = scene.add.text(24, 694, 'WASD MOVE  |  MOUSE AIM  |  CLICK FIRE  |  P PAUSE  |  M MUTE',
      style(9, CSS.dim)).setDepth(50).setAlpha(0.7);
    scene.tweens.add({ targets: this.controls, alpha: 0, delay: 8000, duration: 1200 });

    this.pauseOverlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72)
      .setDepth(100).setVisible(false);
    this.pauseTitle = scene.add.text(640, 316, UI.paused, style(42, CSS.cyan))
      .setOrigin(0.5).setDepth(101).setVisible(false);
    this.pauseHint = scene.add.text(640, 372, UI.resume, style(14, CSS.white))
      .setOrigin(0.5).setDepth(101).setVisible(false);

    this.overOverlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.94)
      .setDepth(100).setVisible(false);
    this.overTitle = scene.add.text(640, 232, UI.gameOver, style(44, CSS.magenta))
      .setOrigin(0.5).setDepth(101).setVisible(false);
    this.overScore = scene.add.text(640, 306, '', style(20, CSS.white))
      .setOrigin(0.5).setDepth(101).setVisible(false);
    this.overWave = scene.add.text(640, 340, '', style(14, CSS.cyan))
      .setOrigin(0.5).setDepth(101).setVisible(false);
    this.overBest = scene.add.text(640, 372, '', style(12, CSS.dim))
      .setOrigin(0.5).setDepth(101).setVisible(false);
    this.overHint = scene.add.text(640, 432, UI.restart, style(14, CSS.white))
      .setOrigin(0.5).setDepth(101).setVisible(false);
  }

  updateHud(data) {
    const score = formatScore(data.score);
    if (score !== this.last.score) {
      this.scoreText.setText(score);
      this.last.score = score;
    }
    const best = `${UI.best} ${formatScore(data.best)}`;
    if (best !== this.last.best) {
      this.bestText.setText(best);
      this.last.best = best;
    }
    const wave = `${UI.wave} ${String(data.wave).padStart(2, '0')}`;
    if (wave !== this.last.wave) {
      this.waveText.setText(wave);
      this.last.wave = wave;
    }
    const mult = `x${data.mult}`;
    if (mult !== this.last.mult) {
      this.multText.setText(mult);
      this.multText.setColor(data.mult >= 8 ? CSS.green : data.mult >= 4 ? CSS.orange : CSS.magenta);
      this.last.mult = mult;
    }
    const available = Math.max(0, CFG.PLAYER.maxBullets - data.bullets);
    const ammo = `AMMO ${available}`;
    if (ammo !== this.last.ammo) {
      this.ammoText.setText(ammo);
      this.ammoText.setColor(available === 0 ? CSS.red : CSS.dim);
      this.last.ammo = ammo;
    }

    for (let i = 0; i < this.shields.length; i++) {
      const active = i < data.shields;
      this.shields[i].setAlpha(active ? 1 : 0.16);
      this.shields[i].setTint(active ? COLORS.cyan : COLORS.danger);
    }

    if (data.bossHp > 0) {
      this.bossBar.setVisible(true).clear();
      const w = 400;
      const x = 640 - w / 2;
      this.bossBar.fillStyle(0x220022, 0.9);
      this.bossBar.fillRect(x, 80, w, 6);
      this.bossBar.fillStyle(COLORS.magenta, 1);
      this.bossBar.fillRect(x, 80, w * Math.max(0, data.bossHp / data.bossMax), 6);
    } else {
      this.bossBar.setVisible(false).clear();
    }
  }

  setSequence(queue) {
    for (let i = 0; i < this.icons.length; i++) {
      const type = queue[i];
      const icon = this.icons[i];
      if (!type || !ENEMY_DEFS[type]) {
        icon.setVisible(false);
        continue;
      }
      icon.setTexture(ENEMY_DEFS[type].texture)
        .setVisible(true)
        .setScale(i === 0 ? 0.92 : 0.68)
        .setAlpha(i === 0 ? 1 : 0.55);
    }
    this.targetLabel.setText(queue.length ? UI.target : `${UI.target} -`);
  }

  waveIntro(wave) {
    const token = ++this.bannerToken;
    this.waveBanner.setText(`${UI.wave} ${wave}`).setVisible(true).setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: this.waveBanner,
      scale: 1.08,
      duration: 300,
      yoyo: true
    });
    this.scene.time.delayedCall(1000, () => {
      if (token === this.bannerToken) this.waveBanner.setVisible(false);
    });
  }

  waveClear(bonus) {
    this.clearBanner.setText(`${UI.waveClear} +${bonus}`).setVisible(true).setAlpha(1);
    this.scene.time.delayedCall(2800, () => this.clearBanner.setVisible(false));
  }

  glitchStart(type) {
    const text = type === 'invert' ? UI.invert : type === 'overclock' ? UI.overclock : UI.disorient;
    this.glitchBanner.setText(text).setVisible(true).setAlpha(1);
    this.scene.tweens.add({
      targets: this.glitchBanner,
      alpha: 0.45,
      duration: 160,
      yoyo: true,
      repeat: 4
    });
  }

  glitchEnd() {
    this.glitchBanner.setVisible(false);
    this.restoredText.setVisible(true).setAlpha(1);
    this.scene.time.delayedCall(600, () => this.restoredText.setVisible(false));
  }

  sequenceLost() {
    this.lostText.setVisible(true).setAlpha(1);
    this.scene.time.delayedCall(700, () => this.lostText.setVisible(false));
    this.scene.cameras.main.flash(120, 255, 0, 40);
  }

  sequenceHit() {
    this.scene.cameras.main.flash(100, 0, 255, 80);
  }

  pause(paused) {
    this.pauseOverlay.setVisible(paused);
    this.pauseTitle.setVisible(paused);
    this.pauseHint.setVisible(paused);
  }

  gameOver(data) {
    this.pause(false);
    this.overOverlay.setVisible(true);
    this.overTitle.setVisible(true);
    this.overScore.setText(`${UI.score} ${formatScore(data.score)}`).setVisible(true);
    this.overWave.setText(`${UI.wave} ${data.wave}`).setVisible(true);
    this.overBest.setText(`${UI.best} ${formatScore(data.best)}`).setVisible(true);
    this.overHint.setVisible(true);
  }

  restart() {
    this.overOverlay.setVisible(false);
    this.overTitle.setVisible(false);
    this.overScore.setVisible(false);
    this.overWave.setVisible(false);
    this.overBest.setVisible(false);
    this.overHint.setVisible(false);
    this.clearBanner.setVisible(false);
    this.glitchBanner.setVisible(false);
    this.restoredText.setVisible(false);
    this.lostText.setVisible(false);
  }

  setAudio(muted, available = true) {
    if (!available) {
      this.soundText.setText(UI.audioOff).setColor(CSS.red);
    } else {
      this.soundText.setText(muted ? UI.soundOff : UI.soundOn).setColor(CSS.dim);
    }
  }
}
