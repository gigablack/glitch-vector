import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mulberry32,
  waveCount,
  unlockedTypes,
  buildWave,
  generateSequence,
  repairSequence,
  glitchInterval,
  pickGlitchType,
  scoreKill,
  reflectAABB,
  hitsRect,
  formatScore,
  enemySpeed,
  segDist2
} from '../src/rules.js';
import { TargetSequence } from '../src/waves.js';

test('scoreKill: acierto normal sube multiplicador', () => {
  const result = scoreKill({ base: 100, multiplier: 1, correct: true, glitch: false, isBoss: false, wave: 1 });
  assert.equal(result.points, 200);
  assert.equal(result.multiplier, 2);
});

test('scoreKill: acierto con Glitch duplica puntos', () => {
  const result = scoreKill({ base: 100, multiplier: 4, correct: true, glitch: true, isBoss: false, wave: 3 });
  assert.equal(result.points, 1000);
  assert.equal(result.multiplier, 5);
});

test('scoreKill: tope x8', () => {
  const result = scoreKill({ base: 100, multiplier: 8, correct: true, glitch: false, isBoss: false, wave: 8 });
  assert.equal(result.points, 800);
  assert.equal(result.multiplier, 8);
});

test('scoreKill: fallo resetea a x1', () => {
  const result = scoreKill({ base: 100, multiplier: 6, correct: false, glitch: false, isBoss: false, wave: 8 });
  assert.equal(result.points, 100);
  assert.equal(result.multiplier, 1);
});

test('scoreKill: mini usa base 50', () => {
  const result = scoreKill({ base: 50, multiplier: 2, correct: true, glitch: false, isBoss: false, wave: 2 });
  assert.equal(result.points, 150);
  assert.equal(result.multiplier, 3);
});

test('scoreKill: jefe ignora multiplicador y aplica Glitch', () => {
  const result = scoreKill({ base: 0, multiplier: 7, correct: false, glitch: true, isBoss: true, wave: 5 });
  assert.equal(result.points, 9000);
  assert.equal(result.multiplier, 7);
});

test('oleadas: cantidad y desbloqueos', () => {
  assert.equal(waveCount(1), 6);
  assert.equal(waveCount(10), 24);
  assert.deepEqual(unlockedTypes(1), ['bouncer']);
  assert.deepEqual(unlockedTypes(4), ['bouncer', 'chaser']);
  assert.equal(unlockedTypes(12).includes('sniper'), false);
  assert.equal(unlockedTypes(13).includes('sniper'), true);
});

test('oleadas: composición normal y de jefe', () => {
  const rng = mulberry32(42);
  const wave1 = buildWave(1, rng);
  assert.equal(wave1.boss, false);
  assert.equal(wave1.types.length, 6);
  assert.deepEqual([...new Set(wave1.types)], ['bouncer']);

  const wave4 = buildWave(4, rng);
  assert.equal(wave4.types.length, 12);
  assert.ok(wave4.types.includes('bouncer'));
  assert.ok(wave4.types.includes('chaser'));

  const wave5 = buildWave(5, rng);
  assert.equal(wave5.boss, true);
  assert.equal(wave5.types.length, 7);
  assert.ok(wave5.types.includes('bouncer'));
  assert.ok(wave5.types.includes('chaser'));

  const wave13 = buildWave(13, rng);
  assert.equal(wave13.types.length, 30);
  assert.ok(wave13.types.includes('sniper'));
  assert.equal(wave13.types.includes('boss'), false);
});

test('oleadas: misma semilla produce misma composición', () => {
  const a = buildWave(8, mulberry32(123));
  const b = buildWave(8, mulberry32(123));
  assert.deepEqual(a, b);
});

test('velocidad de enemigo respeta tope', () => {
  assert.equal(enemySpeed('bouncer', 1), 130);
  assert.equal(enemySpeed('bouncer', 20), 400);
  assert.equal(enemySpeed('tank', 30), 220);
});

test('secuencia: longitud 3 y solo candidatos', () => {
  const seq = generateSequence(['bouncer', 'chaser'], mulberry32(7));
  assert.equal(seq.length, 3);
  for (const type of seq) assert.ok(type === 'bouncer' || type === 'chaser');
});

test('secuencia: un solo candidato permite repetición', () => {
  assert.deepEqual(generateSequence(['bouncer'], mulberry32(1)), ['bouncer', 'bouncer', 'bouncer']);
});

test('secuencia: sin candidatos se oculta', () => {
  assert.deepEqual(generateSequence([], mulberry32(1)), []);
});

test('secuencia: reparación reemplaza tipos extintos', () => {
  const repaired = repairSequence(['tank', 'bouncer'], ['bouncer'], mulberry32(1));
  assert.deepEqual(repaired, ['bouncer', 'bouncer']);
});

test('Glitch: intervalo con suelo de 15 s', () => {
  assert.equal(glitchInterval(1), 30000);
  assert.equal(glitchInterval(5), 24000);
  assert.equal(glitchInterval(11), 15000);
  assert.equal(glitchInterval(20), 15000);
});

test('Glitch: no repite la variante anterior', () => {
  const rng = mulberry32(99);
  for (let i = 0; i < 100; i++) {
    assert.notEqual(pickGlitchType('invert', ['invert', 'overclock', 'disorient'], rng), 'invert');
  }
});

test('TargetSequence: acierto avanza y regenera', () => {
  const sequence = new TargetSequence(mulberry32(3));
  sequence.setCandidates(['bouncer', 'chaser']);
  const target = sequence.queue[0];
  sequence.correct(['bouncer', 'chaser']);
  assert.equal(sequence.queue.length, 3);
  if (target === 'bouncer') assert.ok(sequence.queue.every((type) => type === 'bouncer' || type === 'chaser'));
});

test('TargetSequence: minis cuentan como Bouncer', () => {
  const sequence = new TargetSequence(mulberry32(4));
  sequence.setCandidates(['mini']);
  assert.deepEqual(sequence.queue, ['bouncer', 'bouncer', 'bouncer']);
  assert.equal(sequence.matches('mini'), true);
});

test('TargetSequence: fallo regenera desde candidatos', () => {
  const sequence = new TargetSequence(mulberry32(5));
  sequence.setCandidates(['tank']);
  sequence.wrong(['tank']);
  assert.deepEqual(sequence.queue, ['tank', 'tank', 'tank']);
});

test('colisión AABB: rebote lateral', () => {
  const result = reflectAABB(8, 10, 100, 0, 3, { x: 10, y: 0, w: 10, h: 20 });
  assert.equal(result.hit, true);
  assert.equal(result.axis, 'x');
  assert.ok(result.vx < 0);
  assert.ok(result.x <= 7.01);
});

test('colisión AABB: centro dentro se expulsa por el lado mínimo', () => {
  const result = reflectAABB(15, 10, 100, 0, 3, { x: 10, y: 0, w: 10, h: 20 });
  assert.equal(result.hit, true);
  assert.equal(result.axis, 'x');
  assert.ok(result.x >= 23);
  assert.ok(result.vx > 0);
});

test('colisión AABB: sin solapamiento no cambia nada', () => {
  const result = reflectAABB(0, 0, 10, 5, 3, { x: 10, y: 10, w: 10, h: 10 });
  assert.equal(result.hit, false);
  assert.equal(result.vx, 10);
  assert.equal(result.vy, 5);
});

test('hitsRect detecta círculo contra rectángulo', () => {
  assert.equal(hitsRect(9, 10, 3, { x: 10, y: 0, w: 10, h: 20 }), true);
  assert.equal(hitsRect(0, 0, 3, { x: 10, y: 0, w: 10, h: 20 }), false);
});

test('distancia punto-segmento', () => {
  assert.equal(segDist2(5, 5, 0, 0, 10, 0), 25);
  assert.equal(segDist2(5, 0, 0, 0, 10, 0), 0);
  assert.equal(segDist2(-5, 0, 0, 0, 10, 0), 25);
});

test('formatScore rellena y no trunca valores largos', () => {
  assert.equal(formatScore(12345), '0012345');
  assert.equal(formatScore(0), '0000000');
  assert.equal(formatScore(12345678), '12345678');
});

test('RNG con semilla es determinista', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});
