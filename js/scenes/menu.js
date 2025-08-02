// menu.js
// Esta cena é responsável por exibir o menu de apresentação do jogo.

import { WIDTH, HEIGHT } from '../modules/config.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Adiciona o texto "Pressione ENTER para continuar"
    this.add.text(WIDTH / 2, HEIGHT / 2 - 50, 'Pressione ENTER para continuar', {
      fontSize: '32px',
      fill: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Adiciona o texto de instruções
    this.add.text(WIDTH / 2, HEIGHT / 2, 'Setas Movimentam, Espaço Atira, CTRL Bate', {
      fontSize: '24px',
      fill: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Adiciona o botão "Iniciar"
    const startButton = this.add.text(WIDTH / 2, HEIGHT / 2 + 70, 'Iniciar', {
      fontSize: '36px',
      fill: '#0f0',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
      fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive();

    // Adiciona interatividade ao botão
    startButton.on('pointerover', () => {
      startButton.setStyle({ fill: '#ff0' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ fill: '#0f0' });
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.stop('UIScene'); // Garante que a UIScene não esteja ativa antes do jogo começar
    });

    // Adiciona listener para a tecla ENTER
    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start('GameScene');
      this.scene.stop('UIScene'); // Garante que a UIScene não esteja ativa antes do jogo começar
    });
  }
}