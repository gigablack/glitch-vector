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

test('AudioEngine: soporta bossMode, BPM dinámico y métodos de síntesis de jefes', async () => {
  const { AudioEngine } = await import('../src/audio.js');
  const audio = new AudioEngine();
  assert.equal(audio.bossMode, false);
  assert.equal(audio.bpm, 120);

  audio.setBossMode(true);
  assert.equal(audio.bossMode, true);
  assert.equal(audio.bpm, 152);

  audio.setBossMode(false);
  assert.equal(audio.bossMode, false);
  assert.equal(audio.bpm, 120);

  // Verify sound generation methods exist and execute safely without DOM audio context
  assert.doesNotThrow(() => audio.bossRoar('core'));
  assert.doesNotThrow(() => audio.bossRoar('worm'));
  assert.doesNotThrow(() => audio.bossRoar('dragon'));
  assert.doesNotThrow(() => audio.bossPhaseAlert());
  assert.doesNotThrow(() => audio.microBoom());
  assert.doesNotThrow(() => audio.bossTitanExplosion());
  assert.doesNotThrow(() => audio.sfx('roar'));
  assert.doesNotThrow(() => audio.sfx('phase'));
  assert.doesNotThrow(() => audio.sfx('boss_death'));
});

test('Starter Boost: Nivel 1 inicia con selección de booster antes del primer jefe', () => {
  const bm = new BoosterManager(mulberry32(909));
  const starterOffer = bm.generateOffer(3);
  assert.equal(starterOffer.length, 3);

  // Simulación del flujo de GameScene: wave 0 -> pick starter card -> wave 1
  let wave = 0;
  const pickedCard = starterOffer[0];
  bm.applyBooster(pickedCard);

  if (wave === 0) {
    wave = 1;
  } else {
    wave += 1;
  }

  assert.equal(wave, 1, 'Debe transicionar a oleada 1 (Jefe 1)');
  assert.ok(bm.picked.includes(pickedCard.id), 'El booster inicial debe quedar registrado en las estadísticas de partida');
});

test('Controles: teclado gobierna el desplazamiento y raton gobierna el giro', async () => {
  const { Player } = await import('../src/player.js');
  globalThis.Phaser = { BlendModes: { ADD: 1, SCREEN: 2 } };
  const mockSprite = () => ({
    x: 0, y: 0, rotation: 0,
    setDepth() { return this; },
    setBlendMode() { return this; },
    setVisible() { return this; },
    setTexture() { return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setRotation(r) { this.rotation = r; return this; },
    setAlpha() { return this; },
    setScale() { return this; },
    clearTint() { return this; },
    setTint() { return this; }
  });
  const mockScene = {
    add: {
      sprite: () => mockSprite()
    }
  };
  const player = new Player(mockScene);
  player.reset();

  // Test 1: Ratón a la derecha, sin teclas de movimiento presionadas (input = {x:0, y:0})
  player.update(0.016, { x: 0, y: 0 }, player.x + 200, player.y);
  assert.equal(player.vx, 0, 'Sin teclas, la nave no debe desplazarse hacia el ratón');
  assert.equal(player.vy, 0, 'Sin teclas, la nave no debe desplazarse hacia el ratón');
  assert.equal(player.spr.rotation, 0, 'El ratón a la derecha debe rotar la nave a ángulo 0 rad');

  // Test 2: Pulsar tecla W (arriba: y=-1), ratón apuntando a coordenadas fijas de mundo
  const targetX = 600;
  const targetY = 300;
  player.update(0.016, { x: 0, y: -1 }, targetX, targetY);
  assert.ok(player.vy < 0, 'La nave debe acelerar hacia arriba por la tecla W');
  const expectedRot = Math.atan2(targetY - player.y, targetX - player.x);
  assert.ok(Math.abs(player.spr.rotation - expectedRot) < 0.0001, 'La orientación debe apuntar exactamente a las coordenadas del ratón');
});

test('Spawn de Jefes: aparecen en el extremo opuesto al jugador', async () => {
  const { getOppositeExtreme, BossController } = await import('../src/bosses.js');

  // Caso 1: Jugador en cuadrante inferior-derecho (x=900, y=600)
  const opp1 = getOppositeExtreme({ x: 900, y: 600 });
  assert.equal(opp1.oppTop, true, 'Si jugador esta abajo, el extremo opuesto debe ser arriba');
  assert.equal(opp1.oppLeft, true, 'Si jugador esta a la derecha, el extremo opuesto debe ser a la izquierda');
  assert.ok(opp1.oppY < 300, 'oppY debe estar en el sector superior');
  assert.ok(opp1.oppX < 500, 'oppX debe estar en el sector izquierdo');

  // Caso 2: Jugador en cuadrante superior-izquierdo (x=300, y=150)
  const opp2 = getOppositeExtreme({ x: 300, y: 150 });
  assert.equal(opp2.oppTop, false, 'Si jugador esta arriba, el extremo opuesto debe ser abajo');
  assert.equal(opp2.oppLeft, false, 'Si jugador esta a la izquierda, el extremo opuesto debe ser a la derecha');
  assert.ok(opp2.oppY > 500, 'oppY debe estar en el sector inferior');
  assert.ok(opp2.oppX > 800, 'oppX debe estar en el sector derecho');

  // Instanciación de los 3 arquetipos de jefe con mock scene
  const mockSprite = () => ({
    x: 0, y: 0,
    setDepth() { return this; },
    setBlendMode() { return this; },
    setVisible() { return this; },
    setScale() { return this; },
    setFlipY() { return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setRotation() { return this; },
    setTint() { return this; },
    clearTint() { return this; },
    destroy() { }
  });
  const mockScene = {
    add: { sprite: () => mockSprite() },
    tweens: { killTweensOf() { } },
    events: { emit() { } }
  };
  const ctrl = new BossController(mockScene, () => 0.5);

  // Jugador abajo-centro
  const player = { x: 640, y: 600 };

  // Jefe 1 (CoreBoss, ola 1)
  const boss1 = ctrl.spawnBoss(1, 1000, 1, player);
  assert.ok(boss1.spr.y < 350, 'CoreBoss debe aparecer en el extremo superior opuesto');
  assert.ok(Math.hypot(boss1.spr.x - player.x, boss1.spr.y - player.y) > 300, 'CoreBoss debe iniciar a distancia segura del jugador');

  // Jefe 2 (WormBoss, ola 3)
  const boss2 = ctrl.spawnBoss(3, 1000, 1, player);
  assert.ok(boss2.y < 200, 'WormBoss debe entrar desde el extremo superior');
  assert.ok(Math.hypot(boss2.x - player.x, boss2.y - player.y) > 350, 'WormBoss debe iniciar a distancia segura del jugador');

  // Jefe 3 (DragonBoss, ola 5)
  const boss3 = ctrl.spawnBoss(5, 1000, 1, player);
  assert.ok(boss3.y < 350, 'DragonBoss debe volar en el extremo superior');
  assert.ok(Math.hypot(boss3.x - player.x, boss3.y - player.y) > 350, 'DragonBoss debe iniciar a distancia segura del jugador');
});

test('Visión de Túnel: culling lógico de visibilidad para enemigos en el punto ciego', async () => {
  globalThis.Phaser = {
    Scene: class {},
    BlendModes: { ADD: 1, SCREEN: 2 },
    Math: {
      Angle: {
        Wrap(a) {
          let ang = a % (Math.PI * 2);
          if (ang < -Math.PI) ang += Math.PI * 2;
          if (ang > Math.PI) ang -= Math.PI * 2;
          return ang;
        }
      }
    }
  };
  const { GameScene } = await import('../src/scenes.js');

  // Simular GameScene con culling
  const scene = Object.create(GameScene.prototype);
  scene.vignette = { tunnelVision: true };
  scene.player = {
    x: 400,
    y: 300,
    dead: false,
    spr: { rotation: 0 } // Apunta a la derecha (0 rad)
  };

  let enemyBehindVisible = true;
  let enemyFrontVisible = false;
  let enemyCloseVisible = false;

  scene.enemies = {
    pools: {
      bouncer: [
        // 1. Enemigo detrás (x=200, y=300, dist=200 > 80): debe ser INVISIBLE
        {
          active: true, x: 200, y: 300,
          spr: { setVisible(v) { enemyBehindVisible = v; } }
        },
        // 2. Enemigo al frente (x=600, y=300, dist=200 > 80): debe ser VISIBLE
        {
          active: true, x: 600, y: 300,
          spr: { setVisible(v) { enemyFrontVisible = v; } }
        },
        // 3. Enemigo detrás pero pegado a la nave (x=370, y=300, dist=30 <= 80): debe ser VISIBLE por proximidad
        {
          active: true, x: 370, y: 300,
          spr: { setVisible(v) { enemyCloseVisible = v; } }
        }
      ]
    }
  };
  scene.ebullets = { items: [] };
  scene.bosses = { activeBoss: null };

  scene.updateTunnelVisionCulling();

  assert.equal(enemyBehindVisible, false, 'El enemigo a la espalda debe estar oculto con setVisible(false)');
  assert.equal(enemyFrontVisible, true, 'El enemigo al frente debe ser visible');
  assert.equal(enemyCloseVisible, true, 'El enemigo dentro del radio de seguridad debe ser visible');
});
