import {
  WIDTH, HEIGHT, LEFT, RIGHT, DERIVACAO, verify_align
} from '../modules/config.js';
import { PedraEnemy } from './objects.js';

class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKeyWalk1, tipo, speedFactor) {
    super(scene, x, y, textureKeyWalk1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.tipo = tipo;
    this.speed = Phaser.Math.Between(3, 3 + speedFactor);
    this.pedras = Phaser.Math.Between(0, 2);
    this.reverse = false;
    this.sprint = 3;
    this.life = 6;
    this.execute = this.action_parado;
    this.dx = 0;
    this.dy = 0;

    this.setOrigin(0.5, 1.0);
    this.setDepth(4);
    this.body.setAllowGravity(false);
  }

  paralaxe(step) { this.x -= step; }
  attack_trigger() { return Phaser.Math.Between(1, 3000) < this.speed * 30; }

  calculate_path(group, diametro) {
    let final_dx = 0, final_dy = 0;
    group.children.iterate((sprite) => {
      if (!sprite || sprite === this) return;
      const dx = sprite.x - this.x;
      const dy = sprite.y - this.y;
      const dist = Math.hypot(dx, dy);
      let vx = 0, vy = 0;
      if (diametro > 0 && dist < diametro && dist > 0) { vx = dx / dist; vy = dy / dist; }
      else if (diametro > 0 && dist > diametro) { vx = 0; vy = 0; }
      else if (diametro === 0 && dist > 0) { vx = dx / dist; vy = dy / dist; }
      final_dx += vx; final_dy += vy;
    });
    return { dx: final_dx, dy: final_dy };
  }

  move(vx, vy) {
    this.x += vx; this.y += vy;
    if (this.x < -50) this.x = -50;
    if (this.x > WIDTH + 50) this.x = WIDTH + 50;
    if (this.y < 0) this.y = 0;
    if (this.y > HEIGHT) this.y = HEIGHT;
  }

  action_parado = () => {
    const key = this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk';
    this.anims.play(key, true);
    this.anims.stop();
  };
  action_andando = () => { this.anims.play(this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk', true); this.setFlipX(this.reverse); };

  action_atirar = () => {
    if (this.pedras <= 0) { this.execute = this.action_parado; return; }
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) { this.anims.play(key, true); this.setFlipX(this.reverse); }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast && !this._shotSpawned) {
      this._shotSpawned = true;
      const dir = this.reverse ? -1 : 1;
      const proj = new PedraEnemy(this.scene, this.x + (dir > 0 ? 20 : -20), this.y - 35, dir);
      this.scene.groupObjEnemy.add(proj);
      this.pedras -= 1;
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) { this._shotSpawned = false; this.execute = this.action_parado; }
  };

  action_in_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) { this.anims.play(key, true); this.setFlipX(this.reverse); }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) { this.execute = this.action_attack; }
  };

  action_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) { this.anims.play(key, true); this.setFlipX(this.reverse); }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) { this.execute = self.action_parado; }
  };

  action_hit = () => {
    const key = this.tipo === 1 ? 'enemy1-hit' : 'enemy2-hit';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) { this.anims.play(key, true); this.setFlipX(this.reverse); }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) { this.execute = this.action_parado; }
  };

  move_hit(dano) {
    this.life -= dano || 1;
    if (this.life <= 0) { this.destroy(); return; }
    this.execute = this.action_hit;
  }

  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false;
    const d = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, target.body.center.x, target.body.center.y);
    if (d < DERIVACAO) {
      return this.reverse ? this.getBounds().left > target.getBounds().left
                          : this.getBounds().left < target.getBounds().left;
    }
    return false;
  }

  calcule_hit() { return 1; }

  customUpdate(groupPlayer, groupEnemy) {
    // Se o inimigo estiver em uma ação de ataque/hit, apenas executa a ação e sai
    if ([this.action_in_attack, this.action_attack, this.action_hit, this.action_atirar].includes(this.execute)) {
        if (typeof this.execute === 'function') this.execute();
        return;
    }

    // Resetar dx e dy para o cálculo do movimento
    this.dx = 0; this.dy = 0;

    groupPlayer.children.iterate((player) => {
        if (!player) return;

        const dx_to_player = player.x - this.x;
        const dy_to_player = player.y - this.y;
        const min_distance_x = this.width * 1.05;

        const is_aligned_vertically = verify_align(this.y, player.y);
        const is_at_min_horizontal_distance = Math.abs(dx_to_player) <= min_distance_x;

        // Condição principal: parado e atacando, ou se movendo
        if (is_aligned_vertically && is_at_min_horizontal_distance) {
            // Parar de se mover
            this.dx = 0;
            this.dy = 0;

            // Lógica de ataque quando parado
            const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (d > min_distance_x) {
                if (this.attack_trigger()) this.execute = this.action_atirar;
            } else { // d <= min_distance_x
                if (this.attack_trigger()) this.execute = this.action_in_attack;
            }

            // Se não atacou, fica parado
            if (![this.action_in_attack, this.action_atirar].includes(this.execute)) {
                this.execute = this.action_parado;
            }
        } else {
            // Se não estiver nas condições de parar, move-se em direção ao player
            if (Math.abs(dx_to_player) > min_distance_x) {
                this.dx += (dx_to_player > 0 ? 1 : -1);
            }
            this.dy += (dy_to_player > 0 ? 1 : -1);
            this.execute = this.action_andando;
        }
    });

    // Manter a lógica de afastamento de outros inimigos
    const apart = this.calculate_path(groupEnemy, 40);
    this.dx -= apart.dx;
    this.dy -= apart.dy;

    const passo_x = Math.trunc(this.dx * this.speed);
    const passo_y = Math.trunc(this.dy * this.speed);

    this.move(passo_x, passo_y);

    if (this.dx < 0) this.reverse = true;
    else if (this.dx > 0) this.reverse = false;

    if (typeof this.execute === 'function') this.execute();
  }
}

export class Enemy1 extends EnemyBase {
  constructor(scene, x, y, speedFactor) { super(scene, x, y, 'enemy1-walk-1', 1, speedFactor); }
}
export class Enemy2 extends EnemyBase {
  constructor(scene, x, y, speedFactor) { super(scene, x, y, 'enemy2-walk-1', 2, speedFactor); }
}