import { CFG, GLITCH_TYPES } from './config.js';
import { glitchInterval, pickGlitchType } from './rules.js';

export class GlitchDirector {
  constructor(scene, audio, rng) {
    this.scene = scene;
    this.audio = audio;
    this.rng = rng;
    this.timer = 0;
    this.active = null;
    this.secondary = null;
    this.remaining = 0;
    this.last = null;
    this.speedMult = 1;
    this.scoreMult = 1;
    this.frequencyMult = 1;
    this.durationBonus = 0;
  }

  reset() {
    this.forceEnd();
    this.timer = 0;
    this.last = null;
    this.speedMult = 1;
    this.scoreMult = 1;
    this.frequencyMult = 1;
    this.durationBonus = 0;
  }

  setModifiers(modifiers = {}) {
    this.frequencyMult = modifiers.glitchFrequencyMult || 1;
    this.durationBonus = modifiers.glitchDurationBonus || 0;
  }

  update(deltaMs, wave, canRun) {
    if (this.active) {
      this.remaining -= deltaMs;
      if (this.remaining <= 0) this.end();
      return;
    }
    if (!canRun) return;
    this.timer += deltaMs;
    const interval = Math.max(8000, glitchInterval(wave) / this.frequencyMult);
    if (this.timer >= interval) this.start(wave);
  }

  start(wave, forced) {
    const type = forced || pickGlitchType(this.last, GLITCH_TYPES, this.rng);
    this.applyGlitch(type, null, CFG.GLITCH.duration + this.durationBonus);
  }

  startCombined(type1, type2, duration = 5000) {
    this.applyGlitch(type1, type2, duration);
  }

  extendGlitch(addedMs = 3000) {
    if (this.active) {
      this.remaining += addedMs;
      this.scene.game.events.emit('glitch:extended', { remaining: this.remaining });
    }
  }

  applyGlitch(type, secondary, duration) {
    this.last = type;
    this.active = type;
    this.secondary = secondary;
    this.remaining = duration;
    this.timer = 0;
    this.speedMult = 1;
    this.scoreMult = 1;

    const allTypes = [type, secondary].filter(Boolean);

    for (const t of allTypes) {
      if (t === 'invert') {
        document.body.classList.add('gv-invert');
      } else if (t === 'overclock') {
        this.speedMult = 2;
        this.scoreMult = 2;
      } else if (t === 'disorient') {
        this.scene.cameras.main.shake(duration, 0.008);
      }
    }

    if (this.audio) {
      this.audio.setGlitch(true);
      this.audio.sfx('glitch');
    }

    // Trigger subtle glitch start event without violent white camera flash
    this.scene.game.events.emit('glitch:start', {
      type: secondary ? `${type}+${secondary}` : type,
      duration
    });
  }

  end() {
    if (!this.active) return;
    const was = this.secondary ? `${this.active}+${this.secondary}` : this.active;
    this.active = null;
    this.secondary = null;
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
    return this.active === 'invert' || this.secondary === 'invert';
  }

  get disorient() {
    return this.active === 'disorient' || this.secondary === 'disorient';
  }

  get overclock() {
    return this.active === 'overclock' || this.secondary === 'overclock';
  }
}
