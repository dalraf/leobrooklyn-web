// player.js
// Este módulo define a classe Player, que representa o jogador no jogo.
// Gerencia o movimento, ações (ataque, tiro), vida, coleta de itens e animações do jogador.

import {
  WIDTH, HEIGHT, SPRITE_LEVEL_Y_HIGH, // Importa constantes de dimensão e posição.
  LEFT, RIGHT, UP, DOWN, STOPPED, MOONWALK, // Importa constantes de direção e estado de movimento.
  DERIVACAO // Importa a constante de tolerância para colisões.
} from '../modules/config.js';

/**
 * Classe Player.
 * Estende Phaser.Physics.Arcade.Sprite para ter corpo físico e animações.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * Construtor da classe Player.
   * @param {Phaser.Scene} scene - A cena do Phaser à qual o jogador pertence.
   * @param {number} x - Posição X inicial do jogador.
   * @param {number} y - Posição Y inicial do jogador.
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'player-stop-1'); // Chama o construtor da classe pai com a textura inicial.
    scene.add.existing(this); // Adiciona o sprite à cena.
    scene.physics.add.existing(this); // Adiciona o sprite ao sistema de física da cena.

    // Atributos e estados do jogador, aproximando do modelo Pygame original.
    this.step = 10; // Velocidade de movimento base do jogador.
    this.sprint = 2; // Fator de sprint (não usado diretamente no movimento, mas pode ser para animação).
    this.counter = 0; // Contador genérico (uso não aparente, pode ser removido se não for utilizado).
    this.reverse = false; // Indica se o sprite está virado para a esquerda (true) ou direita (false).
    this.pedras = 10; // Quantidade de projéteis (pedras) que o jogador possui.
    this.life = 20; // Pontos de vida do jogador.
    this.damage_attack_1 = 2; // Dano causado pelo ataque corpo a corpo do jogador.
    this.move_list = []; // Lista de movimentos pendentes (para combinar inputs).
    this.execute = this.action_parado; // Ação atual do jogador (função a ser executada no update).
    this._shotSpawned = false; // Flag para controlar se um projétil já foi spawnado durante a animação de tiro.

    // Configurações do corpo físico e renderização.
    this.setCollideWorldBounds(false); // Impede que o jogador saia dos limites da tela.
    this.setDepth(5); // Define a profundidade de renderização (para sobreposição de sprites).
    this.body.setAllowGravity(false); // Desativa a gravidade para o corpo físico.

    // Ajusta a origem do sprite e a posição inicial.
    this.setOrigin(0.5, 1.0); // Define a origem do sprite no centro inferior.
    this.y = HEIGHT; // Define a posição Y inicial como a altura máxima da tela.
    this.x = x;

    // Flag para controlar se o jogador está em uma ação de prioridade (ataque/tiro/hit).
    this._inPriorityAction = false;
  }

  /**
   * Reseta o estado do jogador para o início de uma nova corrida.
   */
  reset() {
    this.x = WIDTH / 2; // Posição X central.
    this.y = HEIGHT * 0.65; // Posição Y padrão.
    this.pedras = 10; // Reseta a quantidade de pedras.
    this.life = 20; // Reseta a vida.
    this.reverse = false; // Reseta a direção.
    this.execute = this.action_parado; // Define a ação inicial como parado.
    this.move_list = []; // Limpa a lista de movimentos.
    this.anims.play('player-stop', true); // Inicia a animação de parado.
    this.setFlipX(false); // Garante que o sprite não esteja virado.
    this.setActive(true).setVisible(true); // Ativa e torna o sprite visível.
  }

  // --- API de Movimento ---
  // Métodos para adicionar movimentos à lista de movimentos pendentes.

  move_up() { this.move_list.push(UP); }
  move_down() { this.move_list.push(DOWN); }
  move_left() { this.move_list.push(LEFT); }
  move_right() { this.move_list.push(RIGHT); }

  /**
   * Adiciona o estado 'STOPPED' à lista de movimentos, se nenhuma ação de prioridade estiver ativa.
   */
  move_stopped() {
    if (!this._inPriorityAction) {
      this.move_list.push(STOPPED);
    }
  }

  move_moonwalk() { this.move_list.push(MOONWALK); }

  /**
   * Define a ação atual do jogador para 'atirar'.
   */
  move_atirar() { this.execute = this.action_atirar; }

  /**
   * Define a ação atual do jogador para 'iniciar ataque'.
   */
  move_attack() { this.execute = this.action_in_attack; }

  /**
   * Lógica para combinar os movimentos pendentes e aplicar ao jogador.
   * Similar à função `combine_moviment` do Pygame.
   */
  _combine_movement() {
    let dx = 0, dy = 0;
    let reverse = this.reverse; // Mantém a direção atual por padrão.

    if (!this._inPriorityAction) { // Só processa movimentos se não estiver em uma ação de prioridade.
      if (this.move_list.includes(UP)) dy -= this.step;
      if (this.move_list.includes(DOWN)) dy += this.step;
      if (this.move_list.includes(LEFT)) { dx -= this.step; reverse = true; }
      if (this.move_list.includes(RIGHT)) { dx += this.step; reverse = false; }
      if (this.move_list.includes(MOONWALK)) {
        // No moonwalk, o jogador anda para a direita, mas a animação não vira.
        this.execute = this.action_andando;
        reverse = false; // Garante que o sprite não vire.
      }

      if (dx !== 0 || dy !== 0) { // Se houver movimento.
        this._move(dx, dy); // Aplica o movimento.
        this.execute = this.action_andando; // Define a ação como andando.
        this.reverse = reverse; // Atualiza a direção do sprite.
      } else {
        if (this.move_list.includes(MOONWALK)) {
          this.execute = this.action_andando; // Continua andando se estiver em moonwalk.
        } else {
          // Se não houver movimento e nenhuma ação de prioridade estiver ativa, o jogador para.
          if (this.execute !== this.action_atirar && this.execute !== this.action_in_attack) {
            this.execute = this.action_parado;
          }
        }
      }
    }

    this.move_list = []; // Limpa a lista de movimentos após processar.
  }

  /**
   * Aplica o deslocamento real ao jogador e garante que ele permaneça dentro dos limites da tela.
   * @param {number} dx - Deslocamento no eixo X.
   * @param {number} dy - Deslocamento no eixo Y.
   */
  _move(dx, dy) {
    this.x = WIDTH / 2; // Mantém o jogador fixo no centro horizontalmente.
    this.y += dy;
    // Limites verticais: impede que o jogador vá acima de SPRITE_LEVEL_Y_HIGH ou abaixo de HEIGHT.
    if (this.y < SPRITE_LEVEL_Y_HIGH) this.y = SPRITE_LEVEL_Y_HIGH;
    if (this.y > HEIGHT) this.y = HEIGHT; // Garante que o jogador não ultrapasse o limite inferior da tela.
  }

  /**
   * Calcula o dano que o jogador causa.
   * @returns {number} O valor do dano.
   */
  calcule_hit() {
    // Retorna o dano de ataque se estiver na ação de ataque, caso contrário, 0.
    return this.execute === this.action_attack ? this.damage_attack_1 : 0;
  }

  // --- Definição das Ações/Estados do Jogador ---
  // Cada ação corresponde a uma animação e um comportamento específico.

  /**
   * Ação: Jogador parado.
   * Define a animação de parado e desativa a flag de ação de prioridade.
   */
  action_parado = () => {
    this._inPriorityAction = false;
    this.anims.play('player-stop', true);
  };

  /**
   * Ação: Jogador andando.
   * Define a animação de caminhada e ajusta a direção do sprite.
   */
  action_andando = () => {
    this._inPriorityAction = false;
    this.anims.play('player-walk', true);
    this.setFlipX(this.reverse); // Vira o sprite horizontalmente se 'reverse' for true.
  };

  /**
   * Ação: Jogador atirando.
   * Reproduz a animação de tiro e spawna um projétil no final da animação.
   */
  action_atirar = () => {
    if (this.pedras <= 0) { // Se não tiver pedras, volta ao estado parado.
      this.execute = this.action_parado;
      return;
    }
    this._inPriorityAction = true; // Ativa a flag de ação de prioridade.

    // Inicia a animação de tiro se não estiver já tocando.
    if (this.anims.currentAnim?.key !== 'player-shoot' || this.anims.isPlaying === false) {
      this.anims.play('player-shoot', true);
      this.setFlipX(this.reverse);
    }

    // Spawna o projétil quando a animação atinge o último frame e ainda não foi spawnado.
    if (this.anims.currentFrame && this.anims.currentFrame.isLast && !this._shotSpawned) {
      this._shotSpawned = true;
      const scene = this.scene;
      const dir = this.reverse ? -1 : 1; // Direção do projétil.
      const PedraPlayer = scene.registry.get('Class:PedraPlayer'); // Obtém a classe PedraPlayer do registro da cena.
      const proj = new PedraPlayer(scene, this.x + (dir > 0 ? 20 : -20), this.y - 50, dir);
      scene.groupObjPlayer.add(proj); // Adiciona o projétil ao grupo de objetos do jogador.
      this.pedras -= 1; // Decrementa a contagem de pedras.
    }

    // Volta ao estado parado após a animação de tiro.
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._shotSpawned = false;
      this._inPriorityAction = false;
      this.execute = this.action_parado;
    }
  };

  /**
   * Ação: Jogador iniciando um ataque corpo a corpo.
   * Transiciona para a ação `action_attack` após a animação inicial.
   */
  action_in_attack = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-attack' || this.anims.isPlaying === false) {
      this.anims.play('player-attack', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this.execute = this.action_attack; // Transiciona para o estado de ataque efetivo.
    }
  };

  /**
   * Ação: Jogador realizando um ataque corpo a corpo.
   * Volta ao estado parado após a animação de ataque.
   */
  action_attack = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-attack' || this.anims.isPlaying === false) {
      this.anims.play('player-attack', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._inPriorityAction = false;
      this.execute = this.action_parado; // Volta ao estado parado.
    }
  };

  /**
   * Ação: Jogador sendo atingido.
   * Reproduz a animação de hit e volta ao estado parado.
   */
  action_hit = () => {
    this._inPriorityAction = true;
    if (this.anims.currentAnim?.key !== 'player-hit' || this.anims.isPlaying === false) {
      this.anims.play('player-hit', true);
      this.setFlipX(this.reverse);
    }
    if (this.anims.currentFrame && this.anims.currentFrame.isLast) {
      this._inPriorityAction = false;
      this.execute = this.action_parado; // Volta ao estado parado.
    }
  };

  /**
   * Aplica dano ao jogador.
   * @param {number} dano - A quantidade de dano a ser aplicada.
   */
  move_hit(dano) {
    this.life -= dano; // Reduz a vida.
    if (this.life <= 0) {
      this.destroy(); // Destrói o jogador se a vida chegar a zero (Game Over).
      return;
    }
    this.execute = this.action_hit; // Muda para a ação de ser atingido.
  }

  /**
   * Lida com a coleta de objetos pelo jogador.
   * Aumenta pedras se for uma 'pedra', aumenta vida se for um 'bandaid'.
   * @param {object} object - O objeto coletado.
   */
  get_object(object) {
    if (object.kind === 'pedra') this.pedras += object.damage || 1; // Coleta pedras.
    if (object.kind === 'bandaid') this.life += object.damage || 1; // Coleta band-aids (cura).
  }

  /**
   * Verifica se o ataque do jogador atingiu um alvo.
   * @param {Phaser.Physics.Arcade.Sprite} target - O sprite alvo a ser verificado.
   * @returns {boolean} Verdadeiro se o ataque atingiu o alvo, falso caso contrário.
   */
  check_attack_hit(target) {
    if (this.execute !== this.action_attack) return false; // Só verifica se estiver na ação de ataque.
    const a = new Phaser.Math.Vector2(this.body.center.x, this.body.center.y);
    const b = new Phaser.Math.Vector2(target.body.center.x, target.body.center.y);
    const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y); // Distância entre os centros.
    if (d < DERIVACAO) { // Se a distância for menor que a tolerância de colisão.
      // Verifica a direção do ataque para garantir que o jogador está "olhando" para o alvo.
      if (this.reverse) {
        return this.getBounds().left > target.getBounds().left;
      } else {
        return this.getBounds().left < target.getBounds().left;
      }
    }
    return false;
  }

  /**
   * Método de atualização customizado para o jogador, chamado a cada frame.
   * Combina os movimentos e executa a ação atual.
   */
  customUpdate() {
    this._combine_movement(); // Processa os inputs de movimento.
    if (typeof this.execute === 'function') this.execute(); // Executa a ação atual do jogador.
  }
}