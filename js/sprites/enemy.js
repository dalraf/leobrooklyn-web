// enemy.js
// Este módulo define as classes para os inimigos do jogo.
// Inclui uma classe base `EnemyBase` e classes específicas `Enemy1` e `Enemy2`.

import {
  WIDTH, HEIGHT, DERIVACAO, verify_align // Importa constantes e funções utilitárias.
} from '../modules/config.js';
import { PedraEnemy } from './objects.js'; // Importa a classe PedraEnemy para projéteis.

/**
 * Classe base para todos os inimigos do jogo.
 * Estende Phaser.Physics.Arcade.Sprite para ter corpo físico e animações.
 */
class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  /**
   * Construtor da classe EnemyBase.
   * @param {Phaser.Scene} scene - A cena do Phaser à qual o inimigo pertence.
   * @param {number} x - Posição X inicial do inimigo.
   * @param {number} y - Posição Y inicial do inimigo.
   * @param {string} textureKeyWalk1 - Chave da textura inicial para a animação de caminhada.
   * @param {number} tipo - Tipo do inimigo (1 para Enemy1, 2 para Enemy2).
   * @param {number} speedFactor - Fator que influencia a velocidade do inimigo.
   */
  constructor(scene, x, y, textureKeyWalk1, tipo, speedFactor) {
    super(scene, x, y, textureKeyWalk1); // Chama o construtor da classe pai (Phaser.Sprite).
    scene.add.existing(this); // Adiciona o sprite à cena.
    scene.physics.add.existing(this); // Adiciona o sprite ao sistema de física da cena.

    this.tipo = tipo; // Tipo do inimigo.
    this.speed = Phaser.Math.Between(3, 3 + speedFactor); // Velocidade aleatória baseada no fator.
    this.pedras = Phaser.Math.Between(0, 2); // Quantidade de projéteis que o inimigo pode atirar.
    this.reverse = false; // Indica se o sprite está virado para a esquerda (true) ou direita (false).
    this.sprint = 3; // Fator de sprint (não usado diretamente no movimento, mas pode ser para animação).
    this.life = 6; // Pontos de vida do inimigo.
    this.execute = this.action_parado; // Ação atual do inimigo (função a ser executada no update).
    this.dx = 0; // Deslocamento horizontal calculado.
    this.dy = 0; // Deslocamento vertical calculado.
    this._shotSpawned = false; // Flag para controlar se um projétil já foi spawnado durante a animação de tiro.

    this.setOrigin(0.5, 1.0); // Define a origem do sprite no centro inferior.
    this.setDepth(4); // Define a profundidade de renderização (para sobreposição de sprites).
    this.body.setAllowGravity(false); // Desativa a gravidade para o corpo físico.
  }

  /**
   * Aplica o deslocamento de parallax ao inimigo.
   * @param {number} step - O valor do deslocamento horizontal.
   */
  paralaxe(step) { this.x -= step; }

  /**
   * Determina se o inimigo deve tentar atacar.
   * @returns {boolean} Verdadeiro se o ataque deve ser acionado, falso caso contrário.
   */
  attack_trigger() { return Phaser.Math.Between(1, 3000) < this.speed * 30; }

  /**
   * Calcula o vetor de afastamento de outros sprites em um grupo.
   * Usado para evitar que inimigos se aglomerem.
   * @param {Phaser.Physics.Arcade.Group} group - O grupo de sprites a ser verificado.
   * @param {number} diametro - Diâmetro de influência para o cálculo do afastamento.
   * @returns {{dx: number, dy: number}} Um objeto com os componentes X e Y do vetor de afastamento.
   */
  calculate_path(group, diametro) {
    let final_dx = 0, final_dy = 0;
    group.children.iterate((sprite) => {
      if (!sprite || sprite === this) return; // Ignora sprites nulos ou o próprio inimigo.
      const dx = sprite.x - this.x;
      const dy = sprite.y - this.y;
      const dist = Math.hypot(dx, dy); // Distância entre os sprites.
      let vx = 0, vy = 0;

      // Lógica para calcular o vetor de repulsão.
      if (diametro > 0 && dist < diametro && dist > 0) {
        vx = dx / dist; vy = dy / dist;
      } else if (diametro > 0 && dist > diametro) {
        vx = 0; vy = 0;
      } else if (diametro === 0 && dist > 0) {
        vx = dx / dist; vy = dy / dist;
      }
      final_dx += vx; final_dy += vy;
    });
    return { dx: final_dx, dy: final_dy };
  }

  /**
   * Move o inimigo pelos valores dx e dy e aplica limites de tela.
   * @param {number} vx - Velocidade no eixo X.
   * @param {number} vy - Velocidade no eixo Y.
   */
  move(vx, vy) {
    this.x += vx;
    this.y += vy;
    // Limites de tela com uma pequena margem.
    if (this.x < -50) this.x = -50;
    if (this.x > WIDTH + 50) this.x = WIDTH + 50;
    if (this.y < 0) this.y = 0;
    if (this.y > HEIGHT) this.y = HEIGHT;
  }

  // --- Definição das Ações/Estados do Inimigo ---

  /**
   * Ação: Inimigo parado.
   * Reproduz a primeira frame da animação de caminhada e para.
   */
  action_parado = () => {
    const key = this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk';
    this.anims.play(key, true);
    this.anims.stop();
  };

  /**
   * Ação: Inimigo andando.
   * Reproduz a animação de caminhada e ajusta a direção do sprite.
   */
  action_andando = () => {
    this.anims.play(this.tipo === 1 ? 'enemy1-walk' : 'enemy2-walk', true);
    this.setFlipX(this.reverse); // Vira o sprite horizontalmente se 'reverse' for true.
  };

  /**
   * Ação: Inimigo atirando (lançando projétil).
   * Reproduz a animação de ataque e spawna um projétil no final da animação.
   */
  action_atirar = () => {
    if (this.pedras <= 0) { // Se não tiver projéteis, volta ao estado parado.
      this.execute = this.action_parado;
      return;
    }
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    // Inicia a animação de ataque se não estiver já tocando.
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    // Spawna o projétil quando a animação atinge o último frame e ainda não foi spawnado.
    if (this.anims.currentFrame && this.anims.currentFrame.isLast && !this._shotSpawned) {
      this._shotSpawned = true;
      const dir = this.reverse ? -1 : 1; // Direção do projétil.
      const proj = new PedraEnemy(this.scene, this.x + (dir > 0 ? 20 : -20), this.y - 35, dir);
      this.scene.groupObjEnemy.add(proj); // Adiciona o projétil ao grupo de objetos inimigos.
      this.pedras -= 1; // Decrementa a contagem de projéteis.
    }
    // Volta ao estado parado após a animação de tiro.
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._shotSpawned = false;
      this.execute = this.action_parado;
    }
  };

  /**
   * Ação: Inimigo iniciando um ataque corpo a corpo.
   * Transiciona para a ação `action_attack` após a animação inicial.
   */
  action_in_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_attack; // Transiciona para o estado de ataque efetivo.
    }
  };

  /**
   * Ação: Inimigo realizando um ataque corpo a corpo.
   * Volta ao estado parado após a animação de ataque.
   */
  action_attack = () => {
    const key = this.tipo === 1 ? 'enemy1-attack' : 'enemy2-attack';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_parado; // Volta ao estado parado.
    }
  };

  /**
   * Ação: Inimigo sendo atingido.
   * Reproduz a animação de hit e volta ao estado parado.
   */
  action_hit = () => {
    const key = this.tipo === 1 ? 'enemy1-hit' : 'enemy2-hit';
    if (this.anims.currentAnim?.key !== key || this.anims.isPlaying === false) {
      this.anims.play(key, true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_parado; // Volta ao estado parado.
    }
  };

  /**
   * Aplica dano ao inimigo.
   * @param {number} dano - A quantidade de dano a ser aplicada.
   */
  move_hit(dano) {
    this.life -= dano || 1; // Reduz a vida.
    if (this.life <= 0) {
      this.destroy(); // Destrói o inimigo se a vida chegar a zero.
      return;
    }
    this.execute = this.action_hit; // Muda para a ação de ser atingido.
  }

  /**
   * Verifica se o ataque do inimigo atingiu um alvo.
   * @param {Phaser.Physics.Arcade.Sprite} target - O sprite alvo a ser verificado.
   * @returns {boolean} Verdadeiro se o ataque atingiu o alvo, falso caso contrário.
   */
  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false; // Só verifica se estiver na ação de ataque.
    const d = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, target.body.center.x, target.body.center.y);
    if (d < DERIVACAO) { // Se a distância for menor que a tolerância de colisão.
      // Verifica a direção do ataque para garantir que o inimigo está "olhando" para o alvo.
      return this.reverse ? this.getBounds().left > target.getBounds().left
                          : this.getBounds().left < target.getBounds().left;
    }
    return false;
  }

  /**
   * Calcula o dano que o inimigo causa.
   * @returns {number} O valor do dano.
   */
  calcule_hit() { return 1; } // Inimigos causam 1 de dano.

  /**
   * Método de atualização customizado para o inimigo, chamado a cada frame.
   * Contém a lógica de IA do inimigo.
   * @param {Phaser.Physics.Arcade.Group} groupPlayer - Grupo de sprites do jogador.
   * @param {Phaser.Physics.Arcade.Group} groupEnemy - Grupo de sprites dos inimigos.
   */
  customUpdate(groupPlayer, groupEnemy) {
    // Se o inimigo estiver em uma ação de ataque, hit ou tiro, apenas executa a ação e sai.
    if ([this.action_in_attack, this.action_attack, this.action_hit, this.action_atirar].includes(this.execute)) {
        if (typeof this.execute === 'function') this.execute();
        return;
    }

    this.dx = 0; this.dy = 0; // Reseta os deslocamentos para o cálculo do movimento.

    groupPlayer.children.iterate((player) => {
        if (!player || !player.active) return; // Garante que o player existe e está ativo.

        const dx_to_player = player.x - this.x; // Distância horizontal até o player.
        const dy_to_player = player.y - this.y; // Distância vertical até o player.
        const min_distance_x = this.width * 1.05; // Distância horizontal mínima para considerar ataque.

        const is_aligned_vertically = verify_align(this.y, player.y); // Verifica alinhamento vertical.
        const is_at_min_horizontal_distance = Math.abs(dx_to_player) <= min_distance_x; // Verifica distância horizontal mínima.

        // Lógica de IA: se alinhado verticalmente e na distância de ataque.
        if (is_aligned_vertically && is_at_min_horizontal_distance) {
            this.dx = 0; // Para o movimento horizontal.
            this.dy = 0; // Para o movimento vertical.

            const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (d > min_distance_x) {
                // Se estiver um pouco longe, tenta atirar.
                if (this.attack_trigger()) this.execute = this.action_atirar;
            } else {
                // Se estiver perto, tenta ataque corpo a corpo.
                if (this.attack_trigger()) this.execute = this.action_in_attack;
            }

            // Se nenhuma ação de ataque/tiro foi acionada, fica parado.
            if (![this.action_in_attack, this.action_atirar].includes(this.execute)) {
                this.execute = this.action_parado;
            }
        } else {
            // Se não estiver nas condições de parar/atacar, move-se em direção ao player.
            if (Math.abs(dx_to_player) > min_distance_x) {
                this.dx += (dx_to_player > 0 ? 1 : -1); // Move horizontalmente.
            }
            this.dy += (dy_to_player > 0 ? 1 : -1); // Move verticalmente.
            this.execute = this.action_andando; // Define a ação como andando.
        }
    });

    // Lógica para afastar-se de outros inimigos (evitar sobreposição).
    const apart = this.calculate_path(groupEnemy, 40);
    this.dx -= apart.dx;
    this.dy -= apart.dy;

    const passo_x = Math.trunc(this.dx * this.speed); // Calcula o passo final em X.
    const passo_y = Math.trunc(this.dy * this.speed); // Calcula o passo final em Y.

    this.move(passo_x, passo_y); // Aplica o movimento.

    // Atualiza a direção do sprite com base no movimento horizontal.
    if (this.dx < 0) this.reverse = true;
    else if (this.dx > 0) this.reverse = false;

    // Executa a ação atual do inimigo.
    if (typeof this.execute === 'function') this.execute();
  }
}

/**
 * Classe para o Inimigo tipo 1.
 * Estende EnemyBase com a textura inicial e tipo 1.
 */
export class Enemy1 extends EnemyBase {
  constructor(scene, x, y, speedFactor) {
    super(scene, x, y, 'enemy1-walk-1', 1, speedFactor);
  }
}

/**
 * Classe para o Inimigo tipo 2.
 * Estende EnemyBase com a textura inicial e tipo 2.
 */
export class Enemy2 extends EnemyBase {
  constructor(scene, x, y, speedFactor) {
    super(scene, x, y, 'enemy2-walk-1', 2, speedFactor);
  }
}