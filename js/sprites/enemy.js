// enemy.js
// Módulo de definição dos inimigos do jogo (EnemyBase, Enemy1, Enemy2)
// Responsável por movimentação, ataque, dano e animações dos inimigos.

import { WIDTH, HEIGHT, DERIVACAO, verify_align } from '../modules/config.js';
import { PedraEnemy } from './objects.js';

/**
 * Classe base para todos os inimigos do jogo.
 * Gerencia física, animações, IA e ações do inimigo.
 */
class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKeyWalk1, tipo, speedFactor) {
    super(scene, x, y, textureKeyWalk1);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tipo = tipo;
    this.speed = Phaser.Math.Between(3, 3 + speedFactor); // Velocidade base
    this.pedras = Phaser.Math.Between(0, 2); // Quantidade de projéteis
    this.reverse = false; // Direção do sprite
    this.life = 6; // Vida inicial
    this.execute = this.action_parado;
    this.dx = 0;
    this.dy = 0;
    this._shotSpawned = false;
    this.setOrigin(0.5, 1.0);
    this.setDepth(4);
    this.body.setAllowGravity(false);
  }

  /** Move o inimigo pelo cenário, respeitando limites de tela. */
  move(vx, vy) {
    this.x += vx;
    this.y += vy;
    this.x = Phaser.Math.Clamp(this.x, -50, WIDTH + 50);
    this.y = Phaser.Math.Clamp(this.y, 0, HEIGHT);
  }

  /** Aplica parallax horizontal ao inimigo. */
  paralaxe(step) { this.x -= step; }

  /** Decide se o inimigo deve atacar, considerando a dificuldade. */
  attack_trigger(multiplier = 1) {
    return Phaser.Math.Between(1, 3000) < (this.speed * 30 * multiplier);
  }

  /** Evita aglomeração de inimigos, calculando vetor de afastamento. */
  calculate_path(group, diametro) {
    let final_dx = 0, final_dy = 0;
    group.children.iterate((sprite) => {
      if (!sprite || sprite === this) return;
      const dx = sprite.x - this.x;
      const dy = sprite.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (diametro > 0 && dist < diametro && dist > 0) {
        final_dx += dx / dist;
        final_dy += dy / dist;
      }
    });
    return { dx: final_dx, dy: final_dy };
  }

  /** Aplica dano ao inimigo e executa animação de hit. */
  move_hit(dano) {
    this.life -= dano || 1;
    if (this.life <= 0) {
      this.destroy();
      return;
    }
    this.execute = this.action_hit;
  }

  /** Verifica se o ataque corpo a corpo atingiu o player. */
  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false;
    const d = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, target.body.center.x, target.body.center.y);
    if (d < DERIVACAO) {
      // Só ataca se estiver virado para o player
      if (this.reverse && target.x < this.x) return true;
      if (!this.reverse && target.x > this.x) return true;
    }
    return false;
  }

  /** Dano do inimigo aumenta conforme o placar do jogador. */
  calcule_hit() {
    let score = 0;
    if (this.scene && typeof this.scene.score === 'number') score = this.scene.score;
    const difficultyMultiplier = 1 + (score / 200);
    return Math.round(1 * difficultyMultiplier);
  }

  /** Atualização de IA e ações do inimigo a cada frame. */
  customUpdate(groupPlayer, groupEnemy) {
    let score = 0;
    if (this.scene && typeof this.scene.score === 'number') score = this.scene.score;
    const difficultyMultiplier = 1 + (score / 200);
    if ([this.action_in_attack, this.action_attack, this.action_hit, this.action_atirar].includes(this.execute)) {
      if (typeof this.execute === 'function') this.execute();
      return;
    }
    this.dx = 0; this.dy = 0;
    groupPlayer.children.iterate((player) => {
      if (!player || !player.active) return;
      const dx_to_player = player.x - this.x;
      const dy_to_player = player.y - this.y;
      const min_distance_x = this.width * 2;
      const is_aligned_vertically = verify_align(this.y, player.y);
      const is_at_min_horizontal_distance = Math.abs(dx_to_player) <= min_distance_x;
      this.reverse = dx_to_player < 0; // Mantém sempre virado para o player
      if (is_aligned_vertically && is_at_min_horizontal_distance) {
        this.dx = 0;
        this.dy = 0;
        const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (d > min_distance_x) {
          if (this.attack_trigger(difficultyMultiplier)) this.execute = this.action_atirar;
        } else {
          if (this.attack_trigger(difficultyMultiplier)) this.execute = this.action_in_attack;
        }
        if (![this.action_in_attack, this.action_atirar].includes(this.execute)) {
          this.execute = this.action_parado;
        }
      } else {
        if (Math.abs(dx_to_player) > min_distance_x) {
          this.dx += (dx_to_player > 0 ? 1 : -1);
        }
        this.dy += (dy_to_player > 0 ? 1 : -1);
        this.execute = this.action_andando;
      }
    });
    const apart = this.calculate_path(groupEnemy, 40);
    this.dx -= apart.dx;
    this.dy -= apart.dy;
    const passo_x = Math.trunc(this.dx * this.speed);
    const passo_y = Math.trunc(this.dy * this.speed);
    this.move(passo_x, passo_y);
    // Ação atual do inimigo
    if (typeof this.execute === 'function') this.execute();
  }

  // --- Ações/Estados do Inimigo ---

  /** Parado: reproduz frame inicial da caminhada. */
  action_parado = () => {
    const key = this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk';
    this.anims.play(key, true);
    this.anims.stop();
  };

  /** Andando: animação de caminhada e direção. */
  action_andando = () => {
    this.anims.play(this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk', true);
    this.setFlipX(this.reverse);
  };

  /** Atirando: animação de ataque e spawn de projétil. */
  action_atirar = () => {
    if (this.pedras <= 0) {
      this.execute = this.action_parado;
      return;
    }
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast && !this._shotSpawned) {
      this._shotSpawned = true;
      const dir = this.reverse ? -1 : 1;
      const proj = new PedraEnemy(this.scene, this.x + (dir > 0 ? 20 : -20), this.y - 35, dir);
      this.scene.groupObjEnemy.add(proj);
      this.pedras -= 1;
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._shotSpawned = false;
      this.execute = this.action_parado;
    }
  };

  /** Iniciando ataque corpo a corpo. */
  action_in_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_attack;
    }
  };

  /** Ataque corpo a corpo efetivo. */
  action_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_parado;
    }
  };

  /** Animação de ser atingido. */
  action_hit = () => {
    const key = this.tipo === 1 ? 'enemy1-hit' : 'enemy2-hit';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_parado;
    }
  };
}

/** Inimigo tipo 1. */
export class Enemy1 extends EnemyBase {
  constructor(scene, x, y, speedFactor) {
    super(scene, x, y, 'enemy1-walk-1', 1, speedFactor);
  }
}

/** Inimigo tipo 2. */
export class Enemy2 extends EnemyBase {
  constructor(scene, x, y, speedFactor) {
    super(scene, x, y, 'enemy2-walk-1', 2, speedFactor);
  }
}