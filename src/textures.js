import { COLORS } from './config.js';

function make(scene, key, width, height, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

function poly(g, points) {
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.closePath();
}

function starPoints(cx, cy, outer, inner, count = 5) {
  const points = [];
  for (let i = 0; i < count * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / count;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

export function createTextures(scene) {
  make(scene, 'player', 26, 26, (g) => {
    const points = [[25, 13], [2, 2], [6, 13], [2, 24]];
    g.fillStyle(COLORS.cyan, 1);
    poly(g, points);
    g.fillPath();
    g.lineStyle(1.5, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1, COLORS.white, 0.9);
    g.lineBetween(7, 13, 20, 13);
  });

  // Ship Variant: Armored Kinetic Ramming Prow
  make(scene, 'player_ram', 30, 30, (g) => {
    const points = [[29, 15], [20, 8], [2, 3], [7, 15], [2, 27], [20, 22]];
    g.fillStyle(0xff7a00, 0.9);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    // Armored reinforced wedge
    g.lineStyle(1.5, COLORS.yellow, 1);
    g.lineBetween(16, 7, 28, 15);
    g.lineBetween(16, 23, 28, 15);
    g.lineBetween(16, 7, 16, 23);
  });

  // Ship Variant: Long-Range Piercing Railgun
  make(scene, 'player_railgun', 32, 26, (g) => {
    const points = [[31, 13], [14, 5], [2, 2], [6, 13], [2, 24], [14, 21]];
    g.fillStyle(0x00ffff, 0.85);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    // Railgun dual accelerators
    g.lineStyle(1.5, COLORS.cyan, 1);
    g.lineBetween(12, 11, 30, 11);
    g.lineBetween(12, 15, 30, 15);
    g.fillStyle(COLORS.white, 1);
    g.fillRect(16, 12, 6, 2);
  });

  // Ship Variant: Spread Shotgun Heavy Wing
  make(scene, 'player_spread', 28, 28, (g) => {
    const points = [[26, 14], [18, 2], [2, 5], [7, 14], [2, 23], [18, 26]];
    g.fillStyle(0x00cc88, 0.85);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1.5, COLORS.green, 1);
    g.lineBetween(18, 2, 24, 10);
    g.lineBetween(18, 26, 24, 18);
  });

  // Ship Variant: High-Cadence Burst Fighter
  make(scene, 'player_burst', 28, 26, (g) => {
    const points = [[27, 13], [16, 3], [2, 4], [8, 13], [2, 22], [16, 23]];
    g.fillStyle(0xffaa00, 0.85);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1.5, COLORS.orange, 1);
    g.lineBetween(8, 13, 25, 13);
  });

  // Ship Variant: Tri-Vector Array
  make(scene, 'player_trivector', 28, 28, (g) => {
    const points = [[27, 14], [16, 2], [6, 8], [2, 14], [6, 20], [16, 26]];
    g.fillStyle(0x39ff14, 0.85);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1.5, COLORS.cyan, 1);
    g.lineBetween(6, 8, 20, 14);
    g.lineBetween(6, 20, 20, 14);
  });

  // Upgrade Halo: Aegis Defensive Shield Ring
  make(scene, 'halo_aegis', 44, 44, (g) => {
    const hex = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      hex.push([22 + Math.cos(a) * 19, 22 + Math.sin(a) * 19]);
    }
    g.lineStyle(1.5, COLORS.green, 0.85);
    poly(g, hex);
    g.strokePath();
    g.fillStyle(COLORS.white, 1);
    for (const [hx, hy] of hex) g.fillCircle(hx, hy, 2);
  });

  // Upgrade Halo: Kinetic Ramming Spikes Ring
  make(scene, 'halo_kinetic', 44, 44, (g) => {
    const star = starPoints(22, 22, 20, 15, 6);
    g.lineStyle(1.5, COLORS.orange, 0.85);
    poly(g, star);
    g.strokePath();
    g.fillStyle(COLORS.yellow, 0.9);
    for (let i = 0; i < star.length; i += 2) {
      g.fillCircle(star[i][0], star[i][1], 2);
    }
  });

  // Upgrade Halo: Overclocked Plasma / Accelerator Ring
  make(scene, 'halo_overclock', 44, 44, (g) => {
    g.lineStyle(1.5, COLORS.cyan, 0.8);
    g.strokeCircle(22, 22, 18);
    g.lineStyle(1, COLORS.magenta, 0.9);
    g.strokeCircle(22, 22, 14);
    const star = starPoints(22, 22, 19, 13, 4);
    g.lineStyle(1, COLORS.white, 0.95);
    poly(g, star);
    g.strokePath();
  });

  make(scene, 'bouncer', 24, 24, (g) => {
    const points = [[12, 1], [23, 12], [12, 23], [1, 12]];
    g.fillStyle(COLORS.cyan, 0.9);
    poly(g, points);
    g.fillPath();
    g.lineStyle(1.5, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1, COLORS.cyan, 0.8);
    g.lineBetween(12, 4, 20, 12);
    g.lineBetween(12, 4, 4, 12);
  });

  make(scene, 'chaser', 28, 28, (g) => {
    g.fillStyle(COLORS.magenta, 0.75);
    g.fillRect(3, 3, 22, 22);
    g.lineStyle(2, COLORS.white, 1);
    g.strokeRect(3, 3, 22, 22);
    g.lineStyle(1, COLORS.cyan, 0.9);
    g.strokeRect(9, 9, 10, 10);
    g.lineBetween(3, 3, 9, 9);
    g.lineBetween(25, 3, 19, 9);
    g.lineBetween(3, 25, 9, 19);
    g.lineBetween(25, 25, 19, 19);
  });

  make(scene, 'tank', 40, 40, (g) => {
    g.fillStyle(COLORS.orange, 0.55);
    g.fillCircle(20, 20, 18);
    g.lineStyle(2, COLORS.white, 1);
    g.strokeCircle(20, 20, 18);
    g.lineStyle(1, COLORS.orange, 1);
    g.strokeCircle(20, 20, 11);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      g.lineBetween(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11,
        20 + Math.cos(a) * 18, 20 + Math.sin(a) * 18);
    }
  });

  make(scene, 'splitter', 28, 28, (g) => {
    const points = [[14, 2], [26, 26], [2, 26]];
    g.fillStyle(COLORS.green, 0.7);
    poly(g, points);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.lineStyle(1, COLORS.green, 1);
    g.lineBetween(14, 2, 14, 26);
  });

  make(scene, 'sniper', 30, 30, (g) => {
    const points = starPoints(15, 15, 14, 5.5, 5);
    g.fillStyle(COLORS.yellow, 0.8);
    poly(g, points);
    g.fillPath();
    g.lineStyle(1.5, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
    g.fillStyle(COLORS.magenta, 1);
    g.fillCircle(15, 15, 3);
  });

  make(scene, 'mini', 16, 16, (g) => {
    const points = [[8, 1], [15, 8], [8, 15], [1, 8]];
    g.fillStyle(COLORS.cyan, 0.95);
    poly(g, points);
    g.fillPath();
    g.lineStyle(1, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
  });

  make(scene, 'boss', 140, 140, (g) => {
    const outer = [];
    const inner = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      outer.push([70 + Math.cos(a) * 68, 70 + Math.sin(a) * 68]);
      inner.push([70 + Math.cos(a + Math.PI / 6) * 40, 70 + Math.sin(a + Math.PI / 6) * 40]);
    }
    g.fillStyle(COLORS.magenta, 0.22);
    poly(g, outer);
    g.fillPath();
    g.lineStyle(3, COLORS.white, 1);
    poly(g, outer);
    g.strokePath();
    g.lineStyle(1.5, COLORS.magenta, 1);
    poly(g, inner);
    g.strokePath();
    for (let i = 0; i < 6; i++) {
      g.lineStyle(1, COLORS.cyan, 0.8);
      g.lineBetween(outer[i][0], outer[i][1], inner[(i + 2) % 6][0], inner[(i + 2) % 6][1]);
    }
    g.fillStyle(COLORS.white, 0.9);
    g.fillCircle(70, 70, 8);
    g.lineStyle(2, COLORS.cyan, 1);
    g.strokeCircle(70, 70, 18);
  });

  make(scene, 'bullet', 8, 8, (g) => {
    g.fillStyle(COLORS.cyan, 0.35);
    g.fillCircle(4, 4, 4);
    g.fillStyle(COLORS.white, 1);
    g.fillCircle(4, 4, 2);
  });

  make(scene, 'ebullet', 10, 10, (g) => {
    const points = [[5, 0], [10, 5], [5, 10], [0, 5]];
    g.fillStyle(COLORS.magenta, 0.95);
    poly(g, points);
    g.fillPath();
    g.lineStyle(1, COLORS.white, 1);
    poly(g, points);
    g.strokePath();
  });

  make(scene, 'particle', 2, 2, (g) => {
    g.fillStyle(COLORS.white, 1);
    g.fillRect(0, 0, 2, 2);
  });

  make(scene, 'grid', 64, 64, (g) => {
    g.lineStyle(1, COLORS.cyan, 0.22);
    g.lineBetween(0, 0, 64, 0);
    g.lineBetween(0, 0, 0, 64);
    g.lineStyle(1, COLORS.magenta, 0.1);
    g.lineBetween(32, 0, 32, 64);
    g.lineBetween(0, 32, 64, 32);
  });

  make(scene, 'grid2', 160, 160, (g) => {
    g.lineStyle(1, COLORS.cyan, 0.1);
    g.lineBetween(0, 0, 160, 0);
    g.lineBetween(0, 0, 0, 160);
    g.lineStyle(1, COLORS.magenta, 0.06);
    g.lineBetween(80, 0, 80, 160);
    g.lineBetween(0, 80, 160, 80);
  });

  make(scene, 'cube', 140, 140, (g) => {
    g.lineStyle(2, COLORS.cyan, 0.95);
    g.strokeRect(3, 3, 134, 134);
    g.lineStyle(1, COLORS.cyan, 0.55);
    const diamond = [[70, 8], [132, 70], [70, 132], [8, 70]];
    poly(g, diamond);
    g.strokePath();
    g.lineStyle(1, COLORS.magenta, 0.55);
    g.lineBetween(3, 3, 28, 28);
    g.lineBetween(137, 3, 112, 28);
    g.lineBetween(3, 137, 28, 112);
    g.lineBetween(137, 137, 112, 112);
    g.lineStyle(1, COLORS.white, 0.7);
    g.strokeRect(52, 52, 36, 36);
  });

  make(scene, 'obstacle_block', 100, 40, (g) => {
    g.fillStyle(0x0a1020, 0.85);
    g.fillRect(2, 2, 96, 36);
    g.lineStyle(2, COLORS.cyan, 0.9);
    g.strokeRect(2, 2, 96, 36);
    g.lineStyle(1, COLORS.white, 0.8);
    g.lineBetween(6, 6, 94, 6);
    g.lineBetween(6, 34, 94, 34);
    g.lineStyle(1, COLORS.magenta, 0.5);
    for (let x = 12; x < 90; x += 14) {
      g.lineBetween(x, 6, x + 6, 34);
    }
  });

  make(scene, 'pickup_ammo', 24, 24, (g) => {
    const pts = [[12, 1], [23, 12], [12, 23], [1, 12]];
    g.fillStyle(0x003322, 0.85);
    poly(g, pts);
    g.fillPath();
    g.lineStyle(2, COLORS.green, 1);
    poly(g, pts);
    g.strokePath();
    g.lineStyle(1.5, COLORS.white, 1);
    g.lineBetween(12, 5, 12, 19);
    g.lineBetween(8, 10, 12, 5);
    g.lineBetween(16, 10, 12, 5);
  });

  make(scene, 'pickup_shield', 24, 24, (g) => {
    const pts = [[12, 1], [22, 7], [22, 17], [12, 23], [2, 17], [2, 7]];
    g.fillStyle(0x002233, 0.85);
    poly(g, pts);
    g.fillPath();
    g.lineStyle(2, COLORS.cyan, 1);
    poly(g, pts);
    g.strokePath();
    g.fillStyle(COLORS.white, 1);
    g.fillRect(10, 7, 4, 10);
    g.fillRect(7, 10, 10, 4);
  });

  make(scene, 'pickup_emp', 24, 24, (g) => {
    g.fillStyle(0x220033, 0.85);
    g.fillCircle(12, 12, 10);
    g.lineStyle(2, COLORS.magenta, 1);
    g.strokeCircle(12, 12, 10);
    g.lineStyle(1.5, COLORS.cyan, 1);
    // Lightning bolt in center
    const bolt = [[14, 3], [8, 12], [13, 12], [10, 21], [16, 11], [11, 11]];
    poly(g, bolt);
    g.strokePath();
  });

  make(scene, 'pickup_overdrive', 24, 24, (g) => {
    g.fillStyle(0x331a00, 0.85);
    const star = starPoints(12, 12, 11, 5, 4);
    poly(g, star);
    g.fillPath();
    g.lineStyle(2, COLORS.orange, 1);
    poly(g, star);
    g.strokePath();
    g.lineStyle(1, COLORS.yellow, 1);
    g.strokeCircle(12, 12, 4);
  });

  make(scene, 'pickup_score', 24, 24, (g) => {
    const diamond = [[12, 2], [22, 12], [12, 22], [2, 12]];
    g.fillStyle(0x1a0022, 0.85);
    poly(g, diamond);
    g.fillPath();
    g.lineStyle(2, COLORS.yellow, 1);
    poly(g, diamond);
    g.strokePath();
    g.lineStyle(1.5, COLORS.white, 1);
    g.strokeCircle(12, 12, 4);
  });

  make(scene, 'pickup_chrono', 24, 24, (g) => {
    g.fillStyle(0x001a33, 0.85);
    g.fillCircle(12, 12, 11);
    g.lineStyle(2, 0x00e5ff, 1);
    g.strokeCircle(12, 12, 10);
    g.lineStyle(1.5, COLORS.white, 1);
    const hg = [[7, 6], [17, 6], [12, 12], [17, 18], [7, 18], [12, 12]];
    poly(g, hg);
    g.strokePath();
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(12, 12, 2);
  });

  make(scene, 'pickup_nova', 24, 24, (g) => {
    g.fillStyle(0x330011, 0.85);
    const star = starPoints(12, 12, 11, 4, 6);
    poly(g, star);
    g.fillPath();
    g.lineStyle(2, 0xff3366, 1);
    poly(g, star);
    g.strokePath();
    g.lineStyle(1.5, COLORS.orange, 1);
    g.strokeCircle(12, 12, 4);
    g.fillStyle(COLORS.white, 1);
    g.fillCircle(12, 12, 2);
  });

  make(scene, 'boss_worm_head', 56, 56, (g) => {
    g.fillStyle(COLORS.orange, 0.35);
    g.fillCircle(28, 28, 24);
    g.lineStyle(2.5, COLORS.white, 1);
    g.strokeCircle(28, 28, 24);
    g.lineStyle(2, COLORS.orange, 1);
    g.strokeCircle(28, 28, 16);
    // Mandibles / Jaws
    const leftJaw = [[28, 10], [52, 18], [42, 28]];
    const rightJaw = [[28, 46], [52, 38], [42, 28]];
    g.lineStyle(2, COLORS.danger, 1);
    poly(g, leftJaw);
    g.strokePath();
    poly(g, rightJaw);
    g.strokePath();
    g.fillStyle(COLORS.danger, 1);
    g.fillCircle(38, 20, 3.5);
    g.fillCircle(38, 36, 3.5);
  });

  make(scene, 'boss_worm_body', 44, 44, (g) => {
    g.fillStyle(0x331100, 0.5);
    g.fillCircle(22, 22, 18);
    g.lineStyle(2, COLORS.orange, 1);
    g.strokeCircle(22, 22, 18);
    g.lineStyle(1.5, COLORS.yellow, 0.85);
    g.strokeCircle(22, 22, 11);
    g.lineStyle(1, COLORS.danger, 0.7);
    g.lineBetween(4, 22, 40, 22);
    g.lineBetween(22, 4, 22, 40);
  });

  make(scene, 'boss_worm_tail', 34, 34, (g) => {
    const pts = [[30, 17], [4, 6], [10, 17], [4, 28]];
    g.fillStyle(COLORS.orange, 0.6);
    poly(g, pts);
    g.fillPath();
    g.lineStyle(2, COLORS.white, 1);
    poly(g, pts);
    g.strokePath();
    g.lineStyle(1.5, COLORS.danger, 1);
    g.lineBetween(10, 17, 32, 17);
  });

  make(scene, 'boss_dragon_head', 68, 68, (g) => {
    const pts = [[62, 34], [18, 12], [28, 26], [6, 20], [18, 34], [6, 48], [28, 42], [18, 56]];
    g.fillStyle(0x330033, 0.65);
    poly(g, pts);
    g.fillPath();
    g.lineStyle(2.5, COLORS.magenta, 1);
    poly(g, pts);
    g.strokePath();
    g.lineStyle(1.5, COLORS.white, 1);
    g.lineBetween(28, 26, 62, 34);
    g.lineBetween(28, 42, 62, 34);
    // Glowing eyes
    g.fillStyle(COLORS.cyan, 1);
    g.fillCircle(44, 26, 3.5);
    g.fillCircle(44, 42, 3.5);
  });

  make(scene, 'boss_dragon_wing', 60, 60, (g) => {
    const pts = [[6, 30], [54, 4], [42, 24], [58, 28], [36, 40], [48, 54]];
    g.fillStyle(0x220033, 0.45);
    poly(g, pts);
    g.fillPath();
    g.lineStyle(2, COLORS.magenta, 0.95);
    poly(g, pts);
    g.strokePath();
    g.lineStyle(1, COLORS.cyan, 0.8);
    g.lineBetween(6, 30, 42, 24);
    g.lineBetween(6, 30, 36, 40);
  });

  make(scene, 'boss_dragon_body', 50, 50, (g) => {
    const diamond = [[25, 4], [46, 25], [25, 46], [4, 25]];
    g.fillStyle(0x220022, 0.5);
    poly(g, diamond);
    g.fillPath();
    g.lineStyle(2, COLORS.magenta, 1);
    poly(g, diamond);
    g.strokePath();
    g.lineStyle(1.5, COLORS.cyan, 0.85);
    g.strokeCircle(25, 25, 10);
    g.lineStyle(1.5, COLORS.white, 0.9);
    g.lineBetween(25, 4, 25, 46);
  });
}
