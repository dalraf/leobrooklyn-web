// main.js
// Este arquivo é o ponto de entrada principal do jogo, responsável por:
// - Configurar o ambiente Phaser.
// - Carregar as cenas do jogo (Preload, Game, UI).
// - Gerenciar a responsividade da tela.
// - Controlar o overlay de início e o desbloqueio de áudio (se houver).

// Importa constantes e cenas necessárias de outros módulos.
import { WIDTH, HEIGHT, GAME_FPS } from './modules/config.js';
import { PreloadScene } from './scenes/preload.js';
import { GameScene } from './scenes/game.js';
import { UIScene } from './scenes/ui.js';
import { MenuScene } from './scenes/menu.js';

// Configuração principal do Phaser.
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,        // Mantém proporção e ajusta para caber no container
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centraliza no container
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
  scene: [PreloadScene, MenuScene, GameScene, UIScene],
};

// Adiciona um listener para o evento 'load' da janela, garantindo que o DOM esteja pronto.
window.addEventListener('load', () => {
  // Inicializa a instância do jogo Phaser com a configuração definida.
  const game = new Phaser.Game(config);

  // REMOVIDO: Gerenciamento do overlay de início (tela de "clique para iniciar").
  // O menu agora é gerenciado pela MenuScene do Phaser.

  // REMOVIDO: Lógica de onStart, startBtn e keydown-ENTER para o overlay HTML.
  // Essas interações serão tratadas dentro da MenuScene.
});