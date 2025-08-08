// main.js
// Ponto de entrada do jogo. Responsável por:
// - Configurar Phaser e cenas
// - Gerenciar overlay de início
// - Garantir responsividade
//
// Importações de módulos e cenas
import { WIDTH, HEIGHT, GAME_FPS } from './modules/config.js';
import { PreloadScene } from './scenes/preload.js';
import { GameScene } from './scenes/game.js';
import { UIScene } from './scenes/ui.js';

// Configuração do Phaser
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: WIDTH,
    height: HEIGHT,
  },
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

// Inicialização do jogo e overlay
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);

  // Overlay de início
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');

  // Função para iniciar o jogo
  function onStart() {
    if (overlay) overlay.style.display = 'none';
    game.events.emit('user-start');
  }

  if (startBtn) startBtn.addEventListener('click', onStart);
  if (overlay) overlay.addEventListener('pointerdown', onStart, { once: true });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && overlay && overlay.style.display !== 'none') {
      onStart();
    }
  });
});

// Fim do main.js. Código limpo, modular e comentado.