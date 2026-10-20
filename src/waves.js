import { generateSequence, pick, repairSequence } from './rules.js';

export class TargetSequence {
  constructor(rng) {
    this.rng = rng;
    this.queue = [];
  }

  normalize(type) {
    return type === 'mini' ? 'bouncer' : type;
  }

  clean(candidates) {
    return [...new Set(candidates
      .map((type) => this.normalize(type))
      .filter((type) => type && type !== 'boss'))];
  }

  clear() {
    this.queue = [];
  }

  setCandidates(candidates) {
    const clean = this.clean(candidates);
    if (!clean.length) {
      this.queue = [];
      return this.queue;
    }
    if (this.queue.length) {
      this.queue = repairSequence(this.queue, clean, this.rng);
    } else {
      this.queue = generateSequence(clean, this.rng);
    }
    return this.queue;
  }

  correct(candidates) {
    if (this.queue.length) this.queue.shift();
    const clean = this.clean(candidates);
    if (!clean.length) {
      this.queue = [];
      return this.queue;
    }
    this.queue = repairSequence(this.queue, clean, this.rng);
    while (this.queue.length < 3) this.queue.push(pick(clean, this.rng));
    return this.queue;
  }

  wrong(candidates) {
    const clean = this.clean(candidates);
    this.queue = clean.length ? generateSequence(clean, this.rng) : [];
    return this.queue;
  }

  matches(type) {
    if (!this.queue.length) return false;
    return this.queue[0] === this.normalize(type);
  }
}
