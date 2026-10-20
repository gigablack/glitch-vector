import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BoosterManager,
  ALL_BOOSTERS,
  BUFF_TEMPLATES,
  DEBUFF_TEMPLATES,
  buildDynamicBooster
} from '../src/boosters.js';
import {
  FIELD_BOOSTER_BASES,
  FIELD_BOOSTER_AFFIXES,
  buildDynamicFieldBooster
} from '../src/pickups.js';
import { buildWave, mulberry32 } from '../src/rules.js';

test('BoosterManager: genera exactamente 3 cartas distintas', () => {
  const rng = mulberry32(101);
  const bm = new BoosterManager(rng);
  const cards = bm.generateOffer(3);
  assert.equal(cards.length, 3);
  const ids = new Set(cards.map((c) => c.id));
  assert.equal(ids.size, 3);
  // Verify dynamic structure
  for (const card of cards) {
    assert.ok(card.title && card.title.length > 5);
    assert.ok(card.buff && card.buff.length > 5);
    assert.ok(card.debuff && card.debuff.length > 5);
  }
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

test('Boosters de Disparo: perfiles de armas tácticas', () => {
  const rng = mulberry32(404);
  const bm = new BoosterManager(rng);

  const burst = ALL_BOOSTERS.find((b) => b.id === 'burst_fire');
  bm.applyBooster(burst);
  assert.equal(bm.stats.fireMode, 'burst');

  const spread = ALL_BOOSTERS.find((b) => b.id === 'spread_cannon');
  bm.applyBooster(spread);
  assert.equal(bm.stats.fireMode, 'spread');
  assert.ok(bm.stats.bulletSpeedMult < 1.0);

  const tri = ALL_BOOSTERS.find((b) => b.id === 'trivector_array');
  bm.applyBooster(tri);
  assert.equal(bm.stats.fireMode, 'trivector');

  const pierce = ALL_BOOSTERS.find((b) => b.id === 'piercing_railgun');
  bm.applyBooster(pierce);
  assert.equal(bm.stats.fireMode, 'pierce');
  assert.equal(bm.stats.bulletPierce, true);
  assert.equal(bm.stats.magazineSize, 2);
});

test('Construcción Dinámica de Boosters: Ramming y Vulnerabilidad de Colisión', () => {
  const rng = mulberry32(606);
  const ramBuff = BUFF_TEMPLATES.find((b) => b.id === 'ramming');
  const fragileDebuff = DEBUFF_TEMPLATES.find((d) => d.id === 'fragile_collision');

  assert.ok(ramBuff, 'Debe existir plantilla de daño por colisión');
  assert.ok(fragileDebuff, 'Debe existir plantilla de penalización de colisión');

  const card = buildDynamicBooster(ramBuff, fragileDebuff, rng);
  assert.ok(card.title.includes('RAM'));
  assert.ok(card.buff.includes('Daño por colisión masivo'));
  assert.ok(card.debuff.includes('Vulnerabilidad'));

  const stats = {};
  card.apply(stats);
  assert.equal(stats.rammingDamage, true);
  assert.equal(stats.extraCollisionDamage, true);
  assert.ok(stats.rammingPower >= 2);
});

test('Listas Expandidas de Mejoras y Penalizaciones: Nuevos Arquetipos', () => {
  const rng = mulberry32(707);
  const novaBuff = BUFF_TEMPLATES.find((b) => b.id === 'impact_nova');
  const recoilDebuff = DEBUFF_TEMPLATES.find((d) => d.id === 'recoil_kick');
  const naniteBuff = BUFF_TEMPLATES.find((b) => b.id === 'nanite_repair');
  const hyperDebuff = DEBUFF_TEMPLATES.find((d) => d.id === 'hyper_ebullets');

  assert.ok(novaBuff, 'Debe existir buff impact_nova');
  assert.ok(recoilDebuff, 'Debe existir debuff recoil_kick');
  assert.ok(naniteBuff, 'Debe existir buff nanite_repair');
  assert.ok(hyperDebuff, 'Debe existir debuff hyper_ebullets');

  const card1 = buildDynamicBooster(novaBuff, recoilDebuff, rng);
  const stats1 = {};
  card1.apply(stats1);
  assert.equal(stats1.impactNova, true);
  assert.equal(stats1.recoilKick, true);

  const card2 = buildDynamicBooster(naniteBuff, hyperDebuff, rng);
  const stats2 = {};
  card2.apply(stats2);
  assert.equal(stats2.naniteRepair, true);
  assert.equal(stats2.hyperEbullets, true);
});

test('Boosters de Campo Dinámicos: Construcción con Bases y Afijos', () => {
  const rng = mulberry32(808);
  assert.ok(FIELD_BOOSTER_BASES.length >= 7, 'Debe contar con al menos 7 tipos base de campo');
  assert.ok(FIELD_BOOSTER_AFFIXES.length >= 7, 'Debe contar con afijos de campo');

  const ammoBase = FIELD_BOOSTER_BASES.find((b) => b.id === 'ammo');
  const overchargedAffix = FIELD_BOOSTER_AFFIXES.find((a) => a.id === 'overcharged');
  const booster = buildDynamicFieldBooster(ammoBase, overchargedAffix, rng);

  assert.equal(booster.type, 'ammo');
  assert.equal(booster.affix, 'overcharged');
  assert.ok(booster.name.includes('SOBRECARGADO'));
  assert.ok(booster.name.includes('MUNICIÓN'));
  assert.equal(booster.color, '#00ffff');
});

test('Comportamiento de Disparo Base: 3 disparos por ciclo', () => {
  const bm = new BoosterManager(mulberry32(505));
  assert.equal(bm.stats.magazineSize, 3);
  assert.equal(bm.stats.bulletBounces, 0); // Sin rebotes por defecto
});
