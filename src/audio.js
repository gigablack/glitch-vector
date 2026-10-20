import { readMuted, writeMuted } from './config.js';

let singleton = null;

export function getAudio() {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.dry = null;
    this.wet = null;
    this.noise = null;
    this.timer = null;
    this.playing = false;
    this.paused = false;
    this.muted = readMuted();
    this.glitch = false;
    this.breakMode = false;
    this.wave = 1;
    this.bpm = 120;
    this.step = 0;
    this.bar = 0;
    this.nextTime = 0;
    this.beats = [];
    this.chords = [
      [110.0, 130.81, 164.81],
      [87.31, 110.0, 130.81],
      [130.81, 164.81, 196.0],
      [98.0, 123.47, 146.83]
    ];
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.6;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);

      const musicBus = ctx.createGain();
      musicBus.gain.value = 0.5;
      const sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.7;

      const dry = ctx.createGain();
      dry.gain.value = 1;
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) {
        const x = (i * 2) / curve.length - 1;
        curve[i] = Math.tanh(x * 50);
      }
      shaper.curve = curve;
      shaper.oversample = '2x';
      const wet = ctx.createGain();
      wet.gain.value = 0;
      musicBus.connect(dry);
      musicBus.connect(shaper);
      shaper.connect(wet);
      dry.connect(master);
      wet.connect(master);
      sfxBus.connect(master);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 420;
      bassFilter.connect(musicBus);

      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      this.master = master;
      this.musicBus = musicBus;
      this.sfxBus = sfxBus;
      this.dry = dry;
      this.wet = wet;
      this.bassFilter = bassFilter;
      this.noise = buffer;
      return true;
    } catch {
      this.ctx = null;
      return false;
    }
  }

  setWave(wave) {
    this.wave = wave;
    this.updateBpm();
  }

  updateBpm() {
    this.bpm = this.glitch ? 160 : Math.min(150, 120 + (this.wave - 1) * 2);
  }

  setGlitch(on) {
    this.glitch = on;
    this.updateBpm();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.wet.gain.cancelScheduledValues(now);
    this.dry.gain.cancelScheduledValues(now);
    this.wet.gain.linearRampToValueAtTime(on ? 0.35 : 0, now + 0.2);
    this.dry.gain.linearRampToValueAtTime(on ? 0.65 : 1, now + 0.2);
  }

  setBreak(on) {
    this.breakMode = on;
  }

  setPaused(on) {
    this.paused = on;
    if (!this.ctx || !this.musicBus) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    if (on) {
      this.beats = [];
      this.musicBus.gain.linearRampToValueAtTime(0, now + 0.05);
    } else {
      this.musicBus.gain.linearRampToValueAtTime(0.5, now + 0.08);
      this.nextTime = now + 0.1;
    }
  }

  startMusic() {
    if (!this.init()) return false;
    if (this.timer) clearInterval(this.timer);
    this.playing = true;
    this.paused = false;
    this.step = 0;
    this.bar = 0;
    this.beats = [];
    this.nextTime = this.ctx.currentTime + 0.1;
    if (this.musicBus) this.musicBus.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.timer = setInterval(() => this.tick(), 25);
    return true;
  }

  stopMusic() {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.beats = [];
    if (this.ctx && this.musicBus) {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    }
  }

  tick() {
    if (!this.playing || this.paused || !this.ctx) return;
    if (this.nextTime < this.ctx.currentTime - 1) this.nextTime = this.ctx.currentTime + 0.1;
    const ahead = this.ctx.currentTime + 0.1;
    while (this.nextTime < ahead) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += 15 / this.bpm;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar = (this.bar + 1) % 4;
    }
  }

  scheduleStep(step, time) {
    const chord = this.chords[this.bar];
    if (!this.breakMode) {
      if (step % 4 === 0) this.kick(time);
      if (step === 4 || step === 12) this.snare(time);
      if (step === 2 || step === 6 || step === 10 || step === 14) this.hat(time);
      if (step % 2 === 0) this.bass(time, chord[0] / 2);
    }
    const notes = [0, 1, 2, 1];
    const freq = chord[notes[step % 4]] * 2;
    this.arp(time, freq, this.breakMode ? 0.03 : 0.055);
  }

  tone(type, f0, time, dur, gain, dest, f1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), time);
    if (f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), time + dur);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), time + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env);
    env.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  noiseBurst(time, dur, gain, freq, type = 'highpass', dest = this.sfxBus) {
    if (!this.ctx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(dest);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  kick(time) {
    this.tone('sine', 150, time, 0.25, 0.9, this.musicBus, 45);
    this.beats.push(time);
  }

  snare(time) {
    this.noiseBurst(time, 0.12, 0.18, 1200, 'highpass', this.musicBus);
    this.tone('triangle', 180, time, 0.08, 0.08, this.musicBus, 120);
  }

  hat(time) {
    this.noiseBurst(time, 0.03, 0.045, 6000, 'highpass', this.musicBus);
  }

  bass(time, freq) {
    this.tone('sawtooth', freq, time, 0.18, 0.1, this.bassFilter);
  }

  arp(time, freq, gain) {
    this.tone('square', freq, time, 0.06, gain, this.musicBus);
  }

  sfx(name) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'shoot':
        this.tone('square', 880, t, 0.06, 0.08, this.sfxBus, 220);
        break;
      case 'dry':
        this.tone('square', 1200, t, 0.02, 0.03, this.sfxBus, 400);
        break;
      case 'hit':
        this.noiseBurst(t, 0.04, 0.06, 3000);
        this.tone('square', 300, t, 0.03, 0.05, this.sfxBus, 180);
        break;
      case 'explosion':
        this.noiseBurst(t, 0.2, 0.16, 800, 'lowpass');
        this.tone('sine', 80, t, 0.2, 0.16, this.sfxBus, 30);
        break;
      case 'shield':
        this.tone('sawtooth', 200, t, 0.15, 0.15, this.sfxBus, 60);
        break;
      case 'combo':
        this.tone('square', 660, t, 0.06, 0.07, this.sfxBus);
        this.tone('square', 990, t + 0.06, 0.08, 0.07, this.sfxBus);
        break;
      case 'glitch':
        this.noiseBurst(t, 0.3, 0.12, 2000);
        this.tone('square', 400, t, 0.3, 0.08, this.sfxBus, 80);
        break;
      case 'wave':
        this.tone('square', 440, t, 0.15, 0.06, this.sfxBus);
        this.tone('square', 554, t + 0.08, 0.15, 0.06, this.sfxBus);
        this.tone('square', 659, t + 0.16, 0.2, 0.06, this.sfxBus);
        break;
      case 'boss':
        this.tone('sawtooth', 60, t, 0.4, 0.1, this.sfxBus, 30);
        break;
      default:
        break;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    writeMuted(this.muted);
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.6, now + 0.05);
    }
    return this.muted;
  }

  pollBeat() {
    if (!this.ctx) return false;
    let hit = false;
    const now = this.ctx.currentTime;
    while (this.beats.length && this.beats[0] <= now + 0.02) {
      this.beats.shift();
      hit = true;
    }
    return hit;
  }

  gameOver() {
    if (this.ctx) {
      this.tone('sawtooth', 160, this.ctx.currentTime, 0.6, 0.12, this.sfxBus, 40);
    }
    this.stopMusic();
  }
}
