// Bootstrap do Phaser, cenas base e mapeamento do jogo Pygame -> Phaser
// Usa assets existentes em ../../images e ../../sounds

import { WIDTH, HEIGHT, GAME_FPS, PARALLAX_START_THRESHOLD, WHITE } from './modules/config.js';
import { PreloadScene } from './scenes/preload.js';
import { GameScene } from './scenes/game.js';
import { UIScene } from './scenes/ui.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  fps: {
    target: GAME_FPS,
    forceSetTimeOut: true,
  },
  scene: [PreloadScene, GameScene, UIScene],
};

window.addEventListener('load', () => {
  // Responsividade simples
  const resize = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const ratio = WIDTH / HEIGHT;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };
  window.addEventListener('resize', resize);

  // Inicializa Phaser
  const game = new Phaser.Game(config);
  resize();

  // Overlay de início/áudio unlock
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const onStart = () => {
    overlay.style.display = 'none';
    // Emite evento global para cena iniciar música/estado
    game.events.emit('user-start');
  };
  startBtn.addEventListener('click', onStart);

  // ENTER também inicia
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && overlay.style.display !== 'none') {
      onStart();
    }
  });
});