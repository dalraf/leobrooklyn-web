import { WIDTH, HEIGHT } from '../modules/config.js';

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
    // destrói se sair da tela com margem
    if (this.x < -100 || this.x > WIDTH + 100) this.destroy();
  }
}

export class PedraPlayer extends PedraBase {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'pedra');
    this.dir = dir; // +1 direita, -1 esquerda
  }
  customUpdate() {
    this.x += (this.dir > 0 ? 1 : -1) * this.speed;
    super.customUpdate();
  }
}

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
    // estático não faz nada; se sair da tela, destrói
    if (this.x < -100) this.destroy();
  }
}

export class PedraParada extends StaticBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'pedra');
    this.kind = 'pedra';
    this.damage = 3;
  }
}

export class BandAid extends StaticBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'bandaid');
    this.kind = 'bandaid';
    this.damage = 3;
  }
}