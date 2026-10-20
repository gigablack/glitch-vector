import { BootScene, MenuScene, GameScene, UIScene } from './scenes.js';

if (!window.Phaser) {
  const fallback = document.getElementById('fallback');
  if (fallback) fallback.style.display = 'block';
} else {
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    banner: false,
    disableContextMenu: true,
    audio: { noAudio: true },
    fps: { target: 60 },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    },
    scene: [BootScene, MenuScene, GameScene, UIScene]
  };

  window.__GV_GAME__ = new Phaser.Game(config);
}
