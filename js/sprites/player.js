import {
  WIDTH, HEIGHT, RESIZE_FACTOR, SPRITE_LEVEL_Y_HIGH,
  LEFT, RIGHT, UP, DOWN, STOPPED, MOONWALK,
  DERIVACAO
} from '../modules/config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-stop-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Estados e atributos aproximando de player.py/persons.py
    this.step = 10;
    this.sprint = 2; // mais rápido para animação de tiro/ataque
    this.counter = 0;
    this.reverse = false;
    this.pedras = 10;
    this.life = 20;
    this.damage_attack_1 = 2;
    this.move_list = [];
    this.execute = this.action_parado;

    // Corpo / limites
    this.setCollideWorldBounds(true);
    this.setDepth(5);
    this.body.setAllowGravity(false);

    // Tamanho aproximado (imagem já vem no tamanho da arte)
    this.setOrigin(0.5, 1.0);
    this.y = y;
    this.x = x;

    // Flags de controle de ações
    this._inPriorityAction = false;
  }

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

  // API de movimento equivalente
  move_up() { this.move_list.push(UP); }
  move_down() { this.move_list.push(DOWN); }
  move_left() { this.move_list.push(LEFT); }
  move_right() { this.move_list.push(RIGHT); }
  move_stopped() {
    if (!this._inPriorityAction) {
      this.move_list.push(STOPPED);
    }
  }
  move_moonwalk() { this.move_list.push(MOONWALK); }
  move_atirar() { this.execute = this.action_atirar; }
  move_attack() { this.execute = this.action_in_attack; }

  // Lógica de movimento combinada similar ao combine_moviment()
  _combine_movement() {
    let dx = 0, dy = 0;
    let reverse = this.reverse;

    if (!this._inPriorityAction) {
      if (this.move_list.includes(UP)) dy -= this.step;
      if (this.move_list.includes(DOWN)) dy += this.step;
      if (this.move_list.includes(LEFT)) { dx -= this.step; reverse = true; }
      if (this.move_list.includes(RIGHT)) { dx += this.step; reverse = false; }
      if (this.move_list.includes(MOONWALK)) {
        // mantém andando para direita sem mudar reverse
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
        } else {
          // Só define para parado se nenhuma ação de prioridade estiver prestes a começar
          if (this.execute !== this.action_atirar && this.execute !== this.action_in_attack) {
            this.execute = this.action_parado;
          }
        }
      }
    }

    this.move_list = [];
  }

  _move(dx, dy) {
    this.x += dx;
    this.y += dy;
    // limites verticais equivalentes
    if (this.y < SPRITE_LEVEL_Y_HIGH) this.y = SPRITE_LEVEL_Y_HIGH;
    if (this.y > HEIGHT) this.y = HEIGHT;
    // limites horizontais
    if (this.x < 0) this.x = 0;
    if (this.x > WIDTH) this.x = WIDTH;
  }

  calcule_hit() {
    // similar a persons.SpritePerson.calcule_hit
    return this.execute === this.action_attack ? this.damage_attack_1 : 0;
  }

  // Ações/estados (usando animações definidas na PreloadScene)
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
    if (this.pedras <= 0) {
      this.execute = this.action_parado;
      return;
    }
    this._inPriorityAction = true;

    if (this.anims.currentAnim?.key !== 'player-shoot' || this.anims.isPlaying === false) {
      this.anims.play('player-shoot', true);
      this.setFlipX(this.reverse);
    }

    // no fim da animação, dispara projétil
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
    // animação de ataque que leva ao estado de ataque efetivo
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
    // ataque efetivo: finaliza e volta ao parado
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

  move_hit(dano) {
    this.life -= dano;
    if (this.life <= 0) {
      this.destroy();
      return;
    }
    this.execute = this.action_hit;
  }

  get_object(object) {
    // PedraParada aumenta pedras; BandAid aumenta vida
    if (object.kind === 'pedra') this.pedras += object.damage || 1;
    if (object.kind === 'bandaid') this.life += object.damage || 1;
  }

  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false;
    const a = new Phaser.Math.Vector2(this.body.center.x, this.body.center.y);
    const b = new Phaser.Math.Vector2(target.body.center.x, target.body.center.y);
    const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (d < DERIVACAO) {
      if (this.reverse) {
        return this.getBounds().left > target.getBounds().left;
      } else {
        return this.getBounds().left < target.getBounds().left;
      }
    }
    return false;
  }

  customUpdate() {
    // combina movimentos e executa ação do tick
    this._combine_movement();
    if (typeof this.execute === 'function') this.execute();
  }
}