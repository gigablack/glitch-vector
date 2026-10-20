import test from 'node:test';
import assert from 'node:assert/strict';
import { BoosterManager, ALL_BOOSTERS } from '../src/boosters.js';
import { buildWave, mulberry32 } from '../src/rules.js';

test('BoosterManager: genera exactamente 3 cartas distintas', () => {
  const rng = mulberry32(101);
  const bm = new BoosterManager(rng);
  const cards = bm.generateOffer(3);
  assert.equal(cards.length, 3);
  const ids = new Set(cards.map((c) => c.id));
  assert.equal(ids.size, 3);
});

test('BoosterManager: aplica modificadores de riesgo y recompensa', () => {
  const rng = mulberry32(202);
  const bm = new BoosterManager(rng);
  const multishot = ALL_BOOSTERS.find((b) => b.id === 'multishot');
  const titan = ALL_BOOSTERS.find((b) => b.id === 'titan_armor');

  bm.applyBooster(multishot);
  assert.equal(bm.stats.maxBulletsBonus, 1);
  assert.equal(bm.stats.glitchFrequencyMult, 1.4);

  bm.applyBooster(titan);
  assert.equal(bm.stats.maxShields, 4);
  assert.equal(bm.stats.bossHpMult, 1.25);
  assert.ok(bm.stats.speedMult < 1.0);
});

test('Cadencia de Jefes: Niveles 1, 3, 5 son jefes; 2, 4, 6 son oleadas regulares', () => {
  const rng = mulberry32(303);
  assert.equal(buildWave(1, rng).boss, true, 'L1 debe ser jefe');
  assert.equal(buildWave(2, rng).boss, false, 'L2 debe ser normal');
  assert.equal(buildWave(3, rng).boss, true, 'L3 debe ser jefe');
  assert.equal(buildWave(4, rng).boss, false, 'L4 debe ser normal');
  assert.equal(buildWave(5, rng).boss, true, 'L5 debe ser jefe');
  assert.equal(buildWave(6, rng).boss, false, 'L6 debe ser normal');
});
