import { CFG, GLITCH_TYPES } from './config.js';
import { glitchInterval, pickGlitchType } from './rules.js';

export class GlitchDirector {
  constructor(scene, audio, rng) {
    this.scene = scene;
    this.audio = audio;
    this.rng = rng;
    this.timer = 0;
    this.active = null;
    this.remaining = 0;
    this.last = null;
    this.speedMult = 1;
    this.scoreMult = 1;
  }

  reset() {
    this.forceEnd();
    this.timer = 0;
    this.last = null;
    this.speedMult = 1;
    this.scoreMult = 1;
  }

  update(deltaMs, wave, canRun) {
    if (this.active) {
      this.remaining -= deltaMs;
      if (this.remaining <= 0) this.end();
      return;
    }
    if (!canRun) return;
    this.timer += deltaMs;
    if (this.timer >= glitchInterval(wave)) this.start(wave);
  }

  start(wave, forced) {
    const type = forced || pickGlitchType(this.last, GLITCH_TYPES, this.rng);
    this.last = type;
    this.active = type;
    this.remaining = CFG.GLITCH.duration;
    this.timer = 0;
    this.speedMult = 1;
    this.scoreMult = 1;

    if (type === 'invert') {
      document.body.classList.add('gv-invert');
    } else if (type === 'overclock') {
      this.speedMult = 2;
      this.scoreMult = 2;
    } else if (type === 'disorient') {
      this.scene.cameras.main.shake(CFG.GLITCH.duration, 0.012);
    }

    if (this.audio) {
      this.audio.setGlitch(true);
      this.audio.sfx('glitch');
    }
    this.scene.cameras.main.flash(120, 255, 0, 255);
    this.scene.game.events.emit('glitch:start', { type, duration: CFG.GLITCH.duration });
  }

  end() {
    if (!this.active) return;
    const was = this.active;
    this.active = null;
    this.remaining = 0;
    this.timer = 0;
    this.speedMult = 1;
    this.scoreMult = 1;
    document.body.classList.remove('gv-invert');
    const cam = this.scene.cameras.main;
    if (cam && cam.shakeEffect) cam.shakeEffect.reset();
    if (this.audio) this.audio.setGlitch(false);
    this.scene.game.events.emit('glitch:end', { type: was });
  }

  forceEnd() {
    if (this.active) this.end();
  }

  get isActive() {
    return this.active !== null;
  }

  get invert() {
    return this.active === 'invert';
  }

  get disorient() {
    return this.active === 'disorient';
  }
}
