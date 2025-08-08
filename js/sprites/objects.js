// objects.js
// Módulo de objetos do jogo: projéteis, itens estáticos e utilitários.

import { WIDTH, HEIGHT } from '../modules/config.js';

/**
 * PedraBase: projétil genérico do jogo.
 */
export class PedraBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey = 'pedra') {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.body.setAllowGravity(false);
    this.speed = 18;
    this.damage = 3;
    this.kind = 'pedra';
    this.setDepth(3);
  }
  paralaxe(step) { this.x -= step; }
  customUpdate() {
    if (this.x < -100 || this.x > WIDTH + 100) this.destroy();
  }
}

/**
 * PedraPlayer: projétil disparado pelo jogador.
 */
export class PedraPlayer extends PedraBase {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'pedra');
    this.dir = dir;
  }
  customUpdate() {
    this.x += (this.dir > 0 ? 1 : -1) * this.speed;
    super.customUpdate();
  }
}

/**
 * PedraEnemy: projétil disparado pelo inimigo.
 */
export class PedraEnemy extends PedraBase {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'pedra');
    this.dir = dir;
    this.setDepth(3);
  }
  customUpdate() {
    this.x += (this.dir > 0 ? 1 : -1) * this.speed;
    super.customUpdate();
  }
}

/**
 * StaticBase: base para objetos estáticos do jogo.
 */
export class StaticBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.body.setAllowGravity(false);
    this.setDepth(2);
    this.damage = 3;
  }
  paralaxe(step) { this.x -= step; }
  customUpdate() {
    if (this.x < -100) this.destroy();
  }
}

/**
 * PedraParada: objeto estático coletável.
 */
export class PedraParada extends StaticBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'pedra');
    this.kind = 'pedra';
    this.damage = 3;
  }
}

/**
 * BandAid: item de cura estático.
 */
export class BandAid extends StaticBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'bandaid');
    this.kind = 'bandaid';
    this.damage = 3;
  }
}