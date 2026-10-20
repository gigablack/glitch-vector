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
}
