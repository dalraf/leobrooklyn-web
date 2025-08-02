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

// Configuração principal do Phaser.
const config = {
  type: Phaser.AUTO, // Detecta automaticamente WebGL ou Canvas.
  parent: 'game-container', // ID do elemento HTML onde o canvas do jogo será inserido.
  width: WIDTH, // Largura do jogo em pixels.
  height: HEIGHT, // Altura do jogo em pixels.
  backgroundColor: '#000000', // Cor de fundo do canvas.
  physics: {
    default: 'arcade', // Define o sistema de física padrão como Arcade Physics.
    arcade: {
      gravity: { y: 0 }, // Sem gravidade vertical para um jogo top-down ou side-scroller sem queda.
      debug: false, // Desativa a exibição de corpos de física para depuração.
    },
  },
  fps: {
    target: GAME_FPS, // Define o FPS alvo do jogo.
    forceSetTimeOut: true, // Força o uso de setTimeout para o loop de jogo, pode melhorar a consistência em alguns navegadores.
  },
  scene: [PreloadScene, GameScene, UIScene], // Array de cenas a serem carregadas pelo jogo.
};

// Adiciona um listener para o evento 'load' da janela, garantindo que o DOM esteja pronto.
window.addEventListener('load', () => {
  // Função para ajustar o tamanho do canvas do jogo com base na janela do navegador.
  const resize = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return; // Garante que o canvas existe.

    const ratio = WIDTH / HEIGHT; // Proporção original do jogo.
    let w = window.innerWidth; // Largura atual da janela.
    let h = window.innerHeight; // Altura atual da janela.

    // Ajusta a largura ou altura para manter a proporção do jogo.
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }

    // Aplica os novos tamanhos ao estilo do canvas.
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };

  // Adiciona um listener para o evento 'resize' da janela para ajustar o jogo dinamicamente.
  window.addEventListener('resize', resize);

  // Inicializa a instância do jogo Phaser com a configuração definida.
  const game = new Phaser.Game(config);
  // Chama resize uma vez para definir o tamanho inicial.
  resize();

  // Gerenciamento do overlay de início (tela de "clique para iniciar").
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');

  // Função chamada ao iniciar o jogo (clique no botão ou Enter).
  const onStart = () => {
    if (overlay) { // Verifica se o overlay existe antes de tentar ocultá-lo
      overlay.style.display = 'none';
    }
    // Emite um evento global para que as cenas possam reagir ao início do usuário (ex: iniciar música).
    game.events.emit('user-start');
  };

  // Adiciona um listener de clique ao botão de início.
  if (startBtn) { // Verifica se o botão de início existe
    startBtn.addEventListener('click', onStart);
  }

  // Permite iniciar o jogo também pressionando a tecla ENTER.
  window.addEventListener('keydown', (e) => {
    // Verifica se a tecla pressionada é 'Enter' e se o overlay ainda está visível.
    if (e.key === 'Enter' && overlay && overlay.style.display !== 'none') {
      onStart();
    }
  });
});