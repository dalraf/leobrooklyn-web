// player.js
// Módulo do jogador: gerencia movimento, ações, vida, coleta e animações.

import {
  WIDTH, HEIGHT, SPRITE_LEVEL_Y_HIGH,
  LEFT, RIGHT, UP, DOWN, STOPPED, MOONWALK,
  DERIVACAO
} from '../modules/config.js';

/**
 * Classe Player: representa o jogador no jogo.
 * Gerencia física, animações, ações e interações.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-stop-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.step = 10;
    this.reverse = false;
    this.pedras = 10;
    this.life = 20;
    this.damage_attack_1 = 2;
    this.move_list = [];
    this.execute = this.action_parado;
    this._shotSpawned = false;
    this.setCollideWorldBounds(false);
    this.setDepth(5);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 1.0);
    this.y = HEIGHT;
    this.x = x;
    this._inPriorityAction = false;
  }

  /** Reseta o estado do jogador para uma nova rodada. */
  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT * 0.65;
    this.pedras = 10;
    this.life = 20;
    this.reverse = false;
    this.execute = this.action_parado;
    this.move_list = [];
    this.anims.play('player-stop', true);
    this.setFlipX(false);
    this.setActive(true).setVisible(true);
  }

  // --- API de Movimento ---
  move_up() { this.move_list.push(UP); }
  move_down() { this.move_list.push(DOWN); }
  move_left() { this.move_list.push(LEFT); }
  move_right() { this.move_list.push(RIGHT); }
  move_stopped() { if (!this._inPriorityAction) this.move_list.push(STOPPED); }
  move_moonwalk() { this.move_list.push(MOONWALK); }
  move_atirar() { this.execute = this.action_atirar; }
  move_attack() { this.execute = this.action_in_attack; }

  /** Combina movimentos pendentes e aplica ao jogador. */
  _combine_movement() {
    let dx = 0, dy = 0, reverse = this.reverse;
    if (!this._inPriorityAction) {
      if (this.move_list.includes(UP)) dy -= this.step;
      if (this.move_list.includes(DOWN)) dy += this.step;
      if (this.move_list.includes(LEFT)) { dx -= this.step; reverse = true; }
      if (this.move_list.includes(RIGHT)) { dx += this.step; reverse = false; }
      if (this.move_list.includes(MOONWALK)) {
        this.execute = this.action_andando;
        reverse = false;
      }
      if (dx !== 0 || dy !== 0) {
        this._move(dx, dy);
        this.execute = this.action_andando;
        this.reverse = reverse;
      } else {
        if (this.move_list.includes(MOONWALK)) {
          this.execute = this.action_andando;
        } else if (this.execute !== this.action_atirar && this.execute !== this.action_in_attack) {
          this.execute = this.action_parado;
        }
      }
    }
    this.move_list = [];
  }

  /** Aplica deslocamento ao jogador e limita dentro da tela. */
  _move(dx, dy) {
    this.x = WIDTH / 2;
    this.y += dy;
    if (this.y < SPRITE_LEVEL_Y_HIGH) this.y = SPRITE_LEVEL_Y_HIGH;
    if (this.y > HEIGHT) this.y = HEIGHT;
  }

  /** Calcula o dano do ataque corpo a corpo. */
  calcule_hit() {
    return this.execute === this.action_attack ? this.damage_attack_1 : 0;
  }

  // --- Ações/Estados do Jogador ---
  action_parado = () => {
    this._inPriorityAction = false;
    this.anims.play('player-stop', true);
  };
  action_andando = () => {
    this._inPriorityAction = false;
    this.anims.play('player-walk', true);
    this.setFlipX(this.reverse);
  };
  action_atirar = () => {
    if (this.pedras <= 0) { this.execute = this.action_parado; return; }
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-shoot' || this.anims.isPlaying === false) {
      this.anims.play('player-shoot', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast && !this._shotSpawned) {
      this._shotSpawned = true;
      const scene = this.scene;
      const dir = this.reverse ? -1 : 1;
      const PedraPlayer = scene.registry.get('Class:PedraPlayer');
      const proj = new PedraPlayer(scene, this.x + (dir > 0 ? 20 : -20), this.y - 50, dir);
      scene.groupObjPlayer.add(proj);
      this.pedras -= 1;
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._shotSpawned = false;
      this._inPriorityAction = false;
      this.execute = this.action_parado;
    }
  };
  action_in_attack = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-attack' || this.anims.isPlaying === false) {
      this.anims.play('player-attack', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_attack;
    }
  };
  action_attack = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-attack' || this.anims.isPlaying === false) {
      this.anims.play('player-attack', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._inPriorityAction = false;
      this.execute = this.action_parado;
    }
  };
  action_hit = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-hit' || this.anims.isPlaying === false) {
      this.anims.play('player-hit', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._inPriorityAction = false;
      this.execute = this.action_parado;
    }
  };

  /** Aplica dano ao jogador. */
  move_hit(dano) {
    this.life -= dano;
    if (this.life <= 0) {
      this.destroy();
      return;
    }
    this.execute = this.action_hit;
  }

  /** Coleta objetos: pedras ou band-aids. */
  get_object(object) {
    if (object.kind === 'pedra') this.pedras += object.damage || 1;
    if (object.kind === 'bandaid') this.life += object.damage || 1;
  }

  /** Verifica se o ataque atingiu o alvo. */
  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false;
    const a = new Phaser.Math.Vector2(this.body.center.x, this.body.center.y);
    const b = new Phaser.Math.Vector2(target.body.center.x, target.body.center.y);
    const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (d < DERIVACAO) {
      if (this.reverse) return this.getBounds().left > target.getBounds().left;
      else return this.getBounds().left < target.getBounds().left;
    }
    return false;
  }

  /** Atualização customizada do jogador a cada frame. */
  customUpdate() {
    this._combine_movement();
    if (typeof this.execute === 'function') this.execute();
  }
}