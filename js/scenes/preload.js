// Cena de preload: carrega imagens individuais e define animações
// Ajustado: remove áudio de música de fundo e flexibiliza ranges conforme arquivos disponíveis
import { resourcePath } from '../modules/config.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Fundo (se existir um bg estático)
    this.load.image('bg', resourcePath('images/bg.png'));

    // Helper para carregar intervalos que podem não existir totalmente
    const loadRange = (prefixKey, pathTpl, start, end) => {
      for (let i = start; i <= end; i++) {
        const key = `${prefixKey}-${i}`;
        const path = resourcePath(pathTpl(i));
        this.load.image(key, path);
      }
    };

    // Player frames (alguns índices podem não existir na pasta copiada; ajuste os limites conforme o que você possui)
    loadRange('player-stop', (i) => `images/Player-1-Stop-${i}.png`, 1, 4);
    loadRange('player-walk', (i) => `images/Player-1-Walk-${i}.png`, 1, 4);
    loadRange('player-attack', (i) => `images/Player-1-Attack-${i}.png`, 1, 5);
    loadRange('player-hit', (i) => `images/Player-1-Hit-${i}.png`, 1, 4);
    // Se a pasta não tiver até 6, reduza o fim para o máximo existente (ex.: 1..5)
    loadRange('player-shoot', (i) => `images/Player-1-Atirar-${i}.png`, 1, 5);

    // Enemy tipo 1
    loadRange('enemy1-walk', (i) => `images/Enemy-1-Walk-${i}.png`, 1, 5);
    loadRange('enemy1-attack', (i) => `images/Enemy-1-Attack-${i}.png`, 1, 6);
    loadRange('enemy1-hit', (i) => `images/Enemy-1-Hit-${i}.png`, 1, 3);

    // Enemy tipo 2
    loadRange('enemy2-walk', (i) => `images/Enemy-2-Walk-${i}.png`, 1, 6);
    loadRange('enemy2-attack', (i) => `images/Enemy-2-Attack-${i}.png`, 1, 6);
    loadRange('enemy2-hit', (i) => `images/Enemy-2-Hit-${i}.png`, 1, 3);

    // Objetos
    this.load.image('pedra', resourcePath('images/pedra.png'));
    this.load.image('bandaid', resourcePath('images/band_aid.png'));
  }

  create() {
    // Define animações encadeando imagens registradas
    const mk = (key, frameKeys, frameRate = 10, repeat = -1) => {
      const frames = frameKeys
        .map((f) => ({ key: f }))
        .filter((f) => this.textures.exists(f.key)); // ignora frames inexistentes
      if (frames.length === 0) return;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({ key, frames, frameRate, repeat });
    };

    // Player (usa only frames existentes)
    mk('player-stop', ['player-stop-1','player-stop-2','player-stop-3','player-stop-4'], 8, -1);
    mk('player-walk', ['player-walk-1','player-walk-2','player-walk-3','player-walk-4','player-walk-5'], 10, -1);
    mk('player-attack', ['player-attack-1','player-attack-2','player-attack-3','player-attack-4','player-attack-5'], 12, 0);
    // Reduzimos shoot para 1..5 por padrão (ajustar conforme arquivos)
    mk('player-shoot', ['player-shoot-1','player-shoot-2','player-shoot-3','player-shoot-4','player-shoot-5'], 14, 0);
    mk('player-hit', ['player-hit-1','player-hit-2','player-hit-3','player-hit-4'], 12, 0);

    // Enemy 1
    mk('enemy1-walk', ['enemy1-walk-1','enemy1-walk-2','enemy1-walk-3','enemy1-walk-4','enemy1-walk-5'], 8, -1);
    mk('enemy1-attack', ['enemy1-attack-1','enemy1-attack-2','enemy1-attack-3','enemy1-attack-4','enemy1-attack-5','enemy1-attack-6'], 10, 0);
    mk('enemy1-hit', ['enemy1-hit-1','enemy1-hit-2','enemy1-hit-3'], 10, 0);

    // Enemy 2
    mk('enemy2-walk', ['enemy2-walk-1','enemy2-walk-2','enemy2-walk-3','enemy2-walk-4','enemy2-walk-5','enemy2-walk-6'], 8, -1);
    mk('enemy2-attack', ['enemy2-attack-1','enemy2-attack-2','enemy2-attack-3','enemy2-attack-4','enemy2-attack-5','enemy2-attack-6'], 10, 0);
    mk('enemy2-hit', ['enemy2-hit-1','enemy2-hit-2','enemy2-hit-3'], 10, 0);

    this.scene.start('GameScene');
  }
}