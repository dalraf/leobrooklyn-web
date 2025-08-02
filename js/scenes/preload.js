// preload.js
// Esta cena é responsável por carregar todos os assets (imagens, sons, etc.)
// e definir as animações do jogo antes que a cena principal (GameScene) seja iniciada.

import { resourcePath } from '../modules/config.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  /**
   * O método preload é onde todos os assets do jogo são carregados.
   * O Phaser garante que todos os assets sejam carregados antes de chamar o método create.
   */
  preload() {
   // Define a base URL para o carregador de assets, considerando o ambiente do GitHub Pages
   // Define a base URL para o carregador de assets, considerando o ambiente do GitHub Pages.
   // Se o host for 'dalraf.github.io', usa o nome do repositório como base. Caso contrário, usa './'.
   this.load.baseURL = (window.location.host === 'dalraf.github.io') ? '/leobrooklyn-web/' : './';
    // Carrega a imagem de fundo principal.
    this.load.image('bg', resourcePath('images/bg.png'));

    /**
     * Helper para carregar uma sequência de imagens com base em um prefixo e um template de caminho.
     * Isso é útil para spritesheets que têm frames numerados (ex: player-walk-1.png, player-walk-2.png).
     * @param {string} prefixKey - O prefixo da chave para os assets (ex: 'player-stop').
     * @param {function(number): string} pathTpl - Uma função que retorna o caminho do arquivo para um dado índice.
     * @param {number} start - O número inicial da sequência.
     * @param {number} end - O número final da sequência.
     */
    const loadRange = (prefixKey, pathTpl, start, end) => {
      for (let i = start; i <= end; i++) {
        const key = `${prefixKey}-${i}`; // Constrói a chave única para o asset (ex: 'player-stop-1').
        const path = resourcePath(pathTpl(i)); // Constrói o caminho completo do arquivo.
        this.load.image(key, path); // Carrega a imagem.
      }
    };

    // Carregamento dos frames de animação do Player.
    // Os limites (start, end) devem corresponder aos arquivos de imagem disponíveis.
    loadRange('player-stop', (i) => `images/Player-1-Stop-${i}.png`, 1, 4);
    loadRange('player-walk', (i) => `images/Player-1-Walk-${i}.png`, 1, 4);
    loadRange('player-attack', (i) => `images/Player-1-Attack-${i}.png`, 1, 5);
    loadRange('player-hit', (i) => `images/Player-1-Hit-${i}.png`, 1, 4);
    loadRange('player-shoot', (i) => `images/Player-1-Atirar-${i}.png`, 1, 5);

    // Carregamento dos frames de animação do Inimigo tipo 1.
    loadRange('enemy1-walk', (i) => `images/Enemy-1-Walk-${i}.png`, 1, 5);
    loadRange('enemy1-attack', (i) => `images/Enemy-1-Attack-${i}.png`, 1, 6);
    loadRange('enemy1-hit', (i) => `images/Enemy-1-Hit-${i}.png`, 1, 3);

    // Carregamento dos frames de animação do Inimigo tipo 2.
    loadRange('enemy2-walk', (i) => `images/Enemy-2-Walk-${i}.png`, 1, 6);
    loadRange('enemy2-attack', (i) => `images/Enemy-2-Attack-${i}.png`, 1, 6);
    loadRange('enemy2-hit', (i) => `images/Enemy-2-Hit-${i}.png`, 1, 3);

    // Carregamento de imagens para objetos estáticos e projéteis.
    this.load.image('pedra', resourcePath('images/pedra.png'));
    this.load.image('bandaid', resourcePath('images/band_aid.png'));
    // Carrega o arquivo de áudio para a música de fundo.
    this.load.audio('music', resourcePath('sounds/musica_fundo.ogg'));
  }

  /**
   * O método create é chamado uma vez após todos os assets terem sido carregados.
   * Usado para criar animações a partir dos frames carregados.
   */
  create() {
    /**
     * Helper para criar animações do Phaser.
     * Garante que apenas frames existentes sejam usados e remove animações duplicadas.
     * @param {string} key - A chave única para a animação (ex: 'player-walk').
     * @param {string[]} frameKeys - Um array de chaves de frames que compõem a animação.
     * @param {number} [frameRate=10] - A taxa de quadros da animação.
     * @param {number} [repeat=-1] - Quantas vezes a animação deve se repetir (-1 para infinito, 0 para uma vez).
     */
    const mk = (key, frameKeys, frameRate = 10, repeat = -1) => {
      // Filtra os frames para garantir que apenas as texturas que realmente existem sejam usadas.
      const frames = frameKeys
        .map((f) => ({ key: f }))
        .filter((f) => this.textures.exists(f.key));

      if (frames.length === 0) return; // Não cria animação se não houver frames válidos.

      // Remove a animação existente com a mesma chave para evitar duplicatas.
      if (this.anims.exists(key)) this.anims.remove(key);
      // Cria a animação.
      this.anims.create({ key, frames, frameRate, repeat });
    };

    // Definição das animações do Player.
    mk('player-stop', ['player-stop-1','player-stop-2','player-stop-3','player-stop-4'], 8, -1);
    mk('player-walk', ['player-walk-1','player-walk-2','player-walk-3','player-walk-4'], 10, -1);
    mk('player-attack', ['player-attack-1','player-attack-2','player-attack-3','player-attack-4','player-attack-5'], 12, 0);
    mk('player-shoot', ['player-shoot-1','player-shoot-2','player-shoot-3','player-shoot-4','player-shoot-5'], 14, 0);
    mk('player-hit', ['player-hit-1','player-hit-2','player-hit-3','player-hit-4'], 12, 0);

    // Definição das animações do Inimigo tipo 1.
    mk('enemy1-walk', ['enemy1-walk-1','enemy1-walk-2','enemy1-walk-3','enemy1-walk-4','enemy1-walk-5'], 8, -1);
    mk('enemy1-attack', ['enemy1-attack-1','enemy1-attack-2','enemy1-attack-3','enemy1-attack-4','enemy1-attack-5','enemy1-attack-6'], 10, 0);
    mk('enemy1-hit', ['enemy1-hit-1','enemy1-hit-2','enemy1-hit-3'], 10, 0);

    // Definição das animações do Inimigo tipo 2.
    mk('enemy2-walk', ['enemy2-walk-1','enemy2-walk-2','enemy2-walk-3','enemy2-walk-4','enemy2-walk-5','enemy2-walk-6'], 8, -1);
    mk('enemy2-attack', ['enemy2-attack-1','enemy2-attack-2','enemy2-attack-3','enemy2-attack-4','enemy2-attack-5','enemy2-attack-6'], 10, 0);
    mk('enemy2-hit', ['enemy2-hit-1','enemy2-hit-2','enemy2-hit-3'], 10, 0);

    // Inicia a cena principal do jogo após o carregamento e criação das animações.
    this.scene.start('MenuScene');
  }
}