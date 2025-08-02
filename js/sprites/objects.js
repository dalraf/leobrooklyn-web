// objects.js
// Este módulo define as classes para os diferentes objetos do jogo,
// incluindo projéteis (pedras) e itens estáticos (pedras paradas, band-aids).

import { WIDTH, HEIGHT } from '../modules/config.js'; // Importa constantes de dimensão.

/**
 * Classe base para projéteis (Pedras).
 * Estende Phaser.Physics.Arcade.Sprite para ter corpo físico e animações.
 */
export class PedraBase extends Phaser.Physics.Arcade.Sprite {
  /**
   * Construtor da classe PedraBase.
   * @param {Phaser.Scene} scene - A cena do Phaser à qual a pedra pertence.
   * @param {number} x - Posição X inicial da pedra.
   * @param {number} y - Posição Y inicial da pedra.
   * @param {string} [textureKey='pedra'] - Chave da textura da pedra.
   */
  constructor(scene, x, y, textureKey = 'pedra') {
    super(scene, x, y, textureKey);
    scene.add.existing(this); // Adiciona o sprite à cena.
    scene.physics.add.existing(this); // Adiciona o sprite ao sistema de física.

    this.setOrigin(0.5, 1.0); // Define a origem no centro inferior.
    this.body.setAllowGravity(false); // Desativa a gravidade.
    this.speed = 18; // Velocidade de movimento da pedra.
    this.damage = 3; // Dano que a pedra causa.
    this.kind = 'pedra'; // Tipo do objeto.
    this.setDepth(3); // Profundidade de renderização.
  }

  /**
   * Aplica o deslocamento de parallax à pedra.
   * @param {number} step - O valor do deslocamento horizontal.
   */
  paralaxe(step) { this.x -= step; }

  /**
   * Método de atualização customizado para a pedra.
   * Destrói a pedra se ela sair da tela.
   */
  customUpdate() {
    // Destrói o objeto se ele sair da tela com uma margem.
    if (this.x < -100 || this.x > WIDTH + 100) this.destroy();
  }
}

/**
 * Projétil disparado pelo jogador.
 * Estende PedraBase e adiciona a direção de movimento.
 */
export class PedraPlayer extends PedraBase {
  /**
   * Construtor da classe PedraPlayer.
   * @param {Phaser.Scene} scene - A cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   * @param {number} dir - Direção do movimento (+1 para direita, -1 para esquerda).
   */
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'pedra');
    this.dir = dir; // Direção do projétil.
  }

  /**
   * Atualização customizada para a PedraPlayer.
   * Move a pedra na direção especificada e chama o customUpdate da classe base.
   */
  customUpdate() {
    this.x += (this.dir > 0 ? 1 : -1) * this.speed; // Move a pedra.
    super.customUpdate(); // Chama o método customUpdate da classe base para verificação de limites.
  }
}

/**
 * Projétil disparado pelo inimigo.
 * Estende PedraBase e adiciona a direção de movimento.
 */
export class PedraEnemy extends PedraBase {
  /**
   * Construtor da classe PedraEnemy.
   * @param {Phaser.Scene} scene - A cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   * @param {number} dir - Direção do movimento (+1 para direita, -1 para esquerda).
   */
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'pedra');
    this.dir = dir;
    this.setDepth(3); // Define a profundidade de renderização.
  }

  /**
   * Atualização customizada para a PedraEnemy.
   * Move a pedra na direção especificada e chama o customUpdate da classe base.
   */
  customUpdate() {
    this.x += (this.dir > 0 ? 1 : -1) * this.speed;
    super.customUpdate();
  }
}

/**
 * Classe base para objetos estáticos no jogo.
 * Estende Phaser.Physics.Arcade.Sprite.
 */
export class StaticBase extends Phaser.Physics.Arcade.Sprite {
  /**
   * Construtor da classe StaticBase.
   * @param {Phaser.Scene} scene - A cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   * @param {string} textureKey - Chave da textura do objeto.
   */
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.body.setAllowGravity(false);
    this.setDepth(2); // Profundidade de renderização.
    this.damage = 3; // Dano padrão (pode ser usado para objetos que causam dano ao contato).
  }

  /**
   * Aplica o deslocamento de parallax ao objeto estático.
   * @param {number} step - O valor do deslocamento horizontal.
   */
  paralaxe(step) { this.x -= step; }

  /**
   * Método de atualização customizado para objetos estáticos.
   * Destrói o objeto se ele sair da tela.
   */
  customUpdate() {
    // Destrói o objeto se ele sair da tela para a esquerda.
    if (this.x < -100) this.destroy();
  }
}

/**
 * Objeto estático: Pedra Parada.
 * Estende StaticBase.
 */
export class PedraParada extends StaticBase {
  /**
   * Construtor da classe PedraParada.
   * @param {Phaser.Scene} scene - A cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'pedra');
    this.kind = 'pedra'; // Define o tipo como 'pedra' para lógica de coleta.
    this.damage = 3; // Dano que causa se colidido (ou valor de coleta se for coletável).
  }
}

/**
 * Objeto estático: Band-Aid (item de cura).
 * Estende StaticBase.
 */
export class BandAid extends StaticBase {
  /**
   * Construtor da classe BandAid.
   * @param {Phaser.Scene} scene - A cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'bandaid');
    this.kind = 'bandaid'; // Define o tipo como 'bandaid' para lógica de coleta.
    this.damage = 3; // Valor de cura que o band-aid fornece.
  }
}