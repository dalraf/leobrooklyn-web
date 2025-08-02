// game.js
// Esta é a cena principal do jogo, responsável por:
// - Gerenciar o loop principal do jogo.
// - Lidar com a entrada do usuário.
// - Implementar o efeito de parallax no fundo e nos objetos.
// - Controlar o spawn de inimigos e objetos.
// - Gerenciar colisões e interações entre os sprites.
// - Atualizar o HUD (Heads-Up Display).
// - Lidar com o estado de Game Over.

import {
  WIDTH, HEIGHT, PARALLAX_START_THRESHOLD,
  DIFICULT_AVANCE, ENEMY_SPAWN_TICK_RESET, DERIVACAO,
  calcule_vetor_distance, // Importa a função de cálculo de distância
  SPRITE_LEVEL_Y_HIGH // Importa a altura de referência para sprites
} from '../modules/config.js';

import { Player } from '../sprites/player.js';
import { Enemy1, Enemy2 } from '../sprites/enemy.js';
import { PedraPlayer, PedraEnemy, PedraParada, BandAid } from '../sprites/objects.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Variáveis de estado do jogo, equivalentes a um GameState.
    this.enemy_spawn_timer = 0; // Contador para o spawn de inimigos.
    this.parallax_offset = 0; // Deslocamento para o efeito parallax.
    this.stopgame = true; // Flag para pausar/reiniciar o jogo.
    this.distance = 0; // Distância percorrida no jogo (afeta a dificuldade).
    this.enemylist = ['enemy1', 'enemy2']; // Lista de tipos de inimigos para spawn.
    this.score = 0; // Pontuação do jogador.
    this.player = null; // Referência ao objeto Player.
    this.hudEl = null; // Referência ao elemento DOM do HUD.
    this.cursors = null; // Objeto para controle de setas do teclado.
    this.keySpace = null; // Tecla Espaço.
    this.keyCtrl = null; // Tecla Ctrl.
    this.keyEnter = null; // Tecla Enter.

    // Flags de controles touch
    this.touchLeft = false;
    this.touchRight = false;
    this.touchUp = false;
    this.touchDown = false;
    this.touchShootOnce = false;  // trigger de um frame
    this.touchAttackOnce = false; // trigger de um frame
  }

  /**
   * Método create é chamado uma vez quando a cena é iniciada.
   * Usado para inicializar objetos do jogo, grupos, inputs e listeners.
   */
  create() {
    // Configuração do fundo com duas imagens para criar um efeito de scroll contínuo (parallax).
    this.bg1 = this.add.image(0, 0, 'bg').setOrigin(0, 0);
    this.bg1.displayHeight = HEIGHT;
    this.bg1.displayWidth = this.bg1.width * (HEIGHT / this.bg1.height);

    this.bg2 = this.add.image(this.bg1.displayWidth, 0, 'bg').setOrigin(0, 0);
    this.bg2.displayHeight = HEIGHT;
    this.bg2.displayWidth = this.bg1.displayWidth;

    // Ajuste responsivo: quando a tela muda (modo FIT), recalcular tamanhos/posições do fundo.
    const reflowBackground = () => {
      // Mantém a altura virtual e ajusta a largura proporcionalmente.
      this.bg1.displayHeight = HEIGHT;
      this.bg1.displayWidth = this.bg1.width * (HEIGHT / this.bg1.height);
      this.bg1.x = 0;
      this.bg1.y = 0;

      this.bg2.displayHeight = HEIGHT;
      this.bg2.displayWidth = this.bg1.displayWidth;
      this.bg2.x = this.bg1.displayWidth;
      this.bg2.y = 0;
    };
    // Ouve mudanças de tamanho do Scale Manager.
    this.scale.on('resize', reflowBackground);
    // Garante estado correto no primeiro frame após criação.
    reflowBackground();

    // Listener para o evento 'user-start' (disparado pelo main.js ao clicar no overlay).
    this.game.events.on('user-start', () => {
      if (this.stopgame) {
        this.stopgame = false; // Inicia o jogo.
        this.resetRun(); // Reseta o estado do jogo.
      }
    });

    // Criação de grupos de física para organizar os sprites e gerenciar colisões.
    this.groupPlayer = this.physics.add.group(); // Grupo para o jogador.
    this.groupEnemy = this.physics.add.group(); // Grupo para os inimigos.
    this.groupObjPlayer = this.physics.add.group(); // Grupo para objetos disparados pelo jogador (ex: pedras).
    this.groupObjEnemy = this.physics.add.group(); // Grupo para objetos disparados pelos inimigos.
    this.groupObjStatic = this.physics.add.group(); // Grupo para objetos estáticos (ex: pedras paradas, band-aids).

    // Inicializa o jogador.
    this._initPlayer();

    // Registra a classe PedraPlayer no registro da cena para acesso global.
    // Isso é útil se outras classes precisarem instanciar PedraPlayer sem importá-la diretamente.
    this.registry.set('Class:PedraPlayer', PedraPlayer);

    // Obtém a referência ao elemento DOM do HUD e o atualiza.
    this.hudEl = document.getElementById('hud');
    this.updateHud();

    // Configura os controles de input do teclado.
    this.cursors = this.input.keyboard.createCursorKeys(); // Setas do teclado.
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Tecla Espaço.
    this.keyCtrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL); // Tecla Ctrl.
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); // Tecla Enter.

    // Listener para a tecla ENTER, permitindo iniciar o jogo.
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.stopgame) this.game.events.emit('user-start');
    });

    // Setup de controles touch
    this._setupTouchControls();

    // Setup do joystick (arrastar)
    this._setupJoystick();
  }

  /**
   * Inicializa ou reinicializa o objeto Player.
   * Usado em `create` e `resetRun` para evitar duplicação de código.
   */
  _initPlayer() {
    if (this.player) {
      this.player.destroy(); // Destrói a instância anterior do player, se existir.
    }
    this.player = new Player(this, WIDTH / 2, HEIGHT); // Reinicializa o player na posição Y máxima.
    this.groupPlayer.add(this.player); // Adiciona o player ao grupo de jogadores.
  }

  /**
   * Reseta o estado do jogo para um novo início.
   * Limpa todos os grupos de sprites, reinicia o jogador, pontuação e timers.
   */
  resetRun() {
    // Limpa todos os grupos de sprites, destruindo os objetos.
    this.groupEnemy.clear(true, true);
    this.groupObjEnemy.clear(true, true);
    this.groupObjPlayer.clear(true, true);
    this.groupObjStatic.clear(true, true);

    this._initPlayer(); // Reinicializa o player.

    // Reseta as variáveis de estado do jogo.
    this.score = 0;
    this.distance = 0;
    this.enemy_spawn_timer = 0;
    this.parallax_offset = 0;
    this.updateHud(); // Atualiza o HUD para refletir o estado resetado.
  }

  /**
   * Spawna inimigos na cena com base em um fator de dificuldade.
   * @param {number} fator - Fator que influencia a quantidade e velocidade dos inimigos.
   */
  spawnEnemies(fator) {
    const count = Phaser.Math.Between(1, fator); // Quantidade de inimigos a serem spawnados.
    for (let i = 0; i < count; i++) {
      const tipo = Phaser.Utils.Array.GetRandom(this.enemylist); // Escolhe um tipo de inimigo aleatoriamente.
      const speedFactor = Math.floor(fator / 2); // Fator de velocidade baseado na dificuldade.
      let enemy;
      // Instancia o inimigo com base no tipo escolhido.
      if (tipo === 'enemy1') {
        enemy = new Enemy1(this, WIDTH + 10, Phaser.Math.Between(SPRITE_LEVEL_Y_HIGH, HEIGHT - 50), speedFactor);
      } else {
        enemy = new Enemy2(this, WIDTH + 10, Phaser.Math.Between(SPRITE_LEVEL_Y_HIGH, HEIGHT - 50), speedFactor);
      }
      this.groupEnemy.add(enemy); // Adiciona o inimigo ao grupo de inimigos.
    }
  }

  /**
   * Spawna objetos estáticos (PedraParada e BandAid) na cena.
   */
  spawnObjects() {
    // Spawna Pedras Paradas.
    const pedrasCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < pedrasCount; i++) {
      const p = new PedraParada(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(p);
    }
    // Spawna BandAids.
    const bandCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < bandCount; i++) {
      const b = new BandAid(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(b);
    }
  }

  /**
   * Gerencia a lógica de geração de inimigos e objetos com base na distância percorrida.
   */
  generateEnemies() {
    if (!this.stopgame) { // Só gera inimigos se o jogo não estiver parado.
      if (this.enemy_spawn_timer === 0) { // Verifica se o timer de spawn zerou.
        if (this.distance % DIFICULT_AVANCE === 0) { // Aumenta a dificuldade a cada DIFICULT_AVANCE.
          const fator = 1 + Math.floor(this.distance / DIFICULT_AVANCE); // Calcula o fator de dificuldade.
          this.spawnEnemies(fator); // Spawna inimigos.
          this.spawnObjects(); // Spawna objetos.
          this.enemy_spawn_timer = ENEMY_SPAWN_TICK_RESET; // Reseta o timer de spawn.
        }
      }
      this.enemy_spawn_timer = Math.max(0, this.enemy_spawn_timer - 1); // Decrementa o timer.
    }
  }

  /**
   * Lida com colisões entre um grupo de sprites e um grupo de objetos, aplicando dano.
   * A colisão é verificada manualmente por distância (DERIVACAO).
   * @param {Phaser.Physics.Arcade.Group} spriteGroup - O grupo de sprites que pode colidir.
   * @param {Phaser.Physics.Arcade.Group} objectGroup - O grupo de objetos que podem ser colididos.
   */
  objectSpriteCollide(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr || !spr.active) return; // Garante que o sprite existe e está ativo.
      objectGroup.children.iterate((obj) => {
        if (!obj || !obj.active) return; // Garante que o objeto existe e está ativo.
        const d = calcule_vetor_distance(spr.body.center, obj.body.center); // Calcula a distância entre os centros.
        if (d < DERIVACAO) { // Se a distância for menor que a tolerância de colisão.
          if (spr.move_hit) spr.move_hit(obj.damage || 1); // Aplica dano ao sprite, se ele tiver o método move_hit.
          obj.destroy(); // Destrói o objeto após a colisão.
        }
      });
    });
  }

  /**
   * Lida com a coleta de objetos por sprites.
   * A coleta é verificada manualmente por distância (DERIVACAO).
   * @param {Phaser.Physics.Arcade.Group} spriteGroup - O grupo de sprites que pode coletar.
   * @param {Phaser.Physics.Arcade.Group} objectGroup - O grupo de objetos que podem ser coletados.
   */
  objectSpriteGet(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr || !spr.active) return;
      objectGroup.children.iterate((obj) => {
        if (!obj || !obj.active) return;
        const d = calcule_vetor_distance(spr.body.center, obj.body.center);
        if (d < DERIVACAO) {
          if (spr.get_object) spr.get_object(obj); // Chama o método get_object do sprite.
          obj.destroy(); // Destrói o objeto após a coleta.
        }
      });
    });
  }

  /**
   * Lida com colisões de ataque entre o jogador e os inimigos.
   * Verifica se o ataque do jogador atingiu um inimigo e vice-versa.
   */
  playerEnemyAttackHit() {
    this.groupPlayer.children.iterate((player) => {
      if (!player || !player.active) return;
      this.groupEnemy.children.iterate((enemy) => {
        if (!enemy || !enemy.active) return;

        // Verifica se o ataque do jogador atingiu o inimigo.
        if (player.check_attack_hit && player.check_attack_hit(enemy)) {
          this.score += enemy.speed || 1; // Aumenta a pontuação.
          if (enemy.move_hit) enemy.move_hit(player.calcule_hit ? player.calcule_hit() : 1); // Aplica dano ao inimigo.
        }
        // Verifica se o ataque do inimigo atingiu o jogador.
        if (enemy.check_attack_hit && enemy.check_attack_hit(player)) {
          if (player.move_hit) player.move_hit(enemy.calcule_hit ? enemy.calcule_hit() : 1); // Aplica dano ao jogador.
        }
      });
    });
  }

  /**
   * Atualiza o texto do HUD com a pontuação, vida e quantidade de pedras do jogador.
   */
  updateHud() {
    if (!this.hudEl) return; // Garante que o elemento HUD existe.
    const pedras = this.player ? this.player.pedras : 0;
    const life = this.player ? this.player.life : 0;
    this.hudEl.textContent = `Placar: ${this.score}  Vida: ${life}  Pedras: ${pedras}`;
  }

  /**
   * Configura listeners para controles touch no DOM.
   */
  _setupTouchControls() {
    const mapHold = (el, setter) => {
      if (!el) return;
      const onDown = (ev) => { ev.preventDefault(); setter(true); };
      const onUp = (ev) => { ev.preventDefault(); setter(false); };
      el.addEventListener('pointerdown', onDown, { passive: false });
      el.addEventListener('pointerup', onUp, { passive: false });
      el.addEventListener('pointercancel', onUp, { passive: false });
      el.addEventListener('pointerleave', onUp, { passive: false });
    };
    const mapOnce = (el, trigger) => {
      if (!el) return;
      el.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        trigger();
      }, { passive: false });
    };

    const up = document.getElementById('btn-up');
    const left = document.getElementById('btn-left');
    const right = document.getElementById('btn-right');
    const down = document.getElementById('btn-down');
    const shoot = document.getElementById('btn-shoot');
    const attack = document.getElementById('btn-attack');

    mapHold(up, (v) => this.touchUp = v);
    mapHold(left, (v) => this.touchLeft = v);
    mapHold(right, (v) => this.touchRight = v);
    mapHold(down, (v) => this.touchDown = v);

    mapOnce(shoot, () => this.touchShootOnce = true);
    mapOnce(attack, () => this.touchAttackOnce = true);
  }

  /**
   * Configura o joystick (base circular + knob) com arraste e zona morta.
   */
  _setupJoystick() {
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joy-knob');
    if (!joy || !knob) return; // se HTML não existir, ignora

    const rectFor = () => joy.getBoundingClientRect();
    const center = () => {
      const r = rectFor();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: Math.min(r.width, r.height) / 2 };
    };

    const deadZone = 0.18;      // fração do raio sem movimento
    const maxKnobOffset = 0.42; // fração do raio para limite visual do knob

    let active = false;
    let id = null;

    const setDirectionFrom = (pageX, pageY) => {
      const { cx, cy, radius } = center();
      const dx = pageX - cx;
      const dy = pageY - cy;
      // normaliza vetor ao raio
      const mag = Math.hypot(dx, dy);
      const norm = mag > 0 ? Math.min(1, mag / radius) : 0;
      let vx = norm > 0 ? dx / mag : 0;
      let vy = norm > 0 ? dy / mag : 0;

      // aplica zona morta
      if (norm < deadZone) {
        vx = 0; vy = 0;
      }

      // define flags discretas a partir do vetor
      this.touchLeft = vx < -0.35;
      this.touchRight = vx > 0.35;
      this.touchUp = vy < -0.35;
      this.touchDown = vy > 0.35;

      // move knob visualmente
      const kmax = radius * maxKnobOffset;
      const kx = Phaser.Math.Clamp(dx, -kmax, kmax);
      const ky = Phaser.Math.Clamp(dy, -kmax, kmax);
      knob.style.transform = `translate(${kx}px, ${ky}px)`;
    };

    const reset = () => {
      this.touchLeft = this.touchRight = this.touchUp = this.touchDown = false;
      knob.style.transform = 'translate(0,0)';
    };

    const onDown = (ev) => {
      ev.preventDefault();
      active = true;
      id = ev.pointerId ?? null;
      joy.setPointerCapture?.(id);
      setDirectionFrom(ev.pageX, ev.pageY);
    };
    const onMove = (ev) => {
      if (!active) return;
      if (id != null && ev.pointerId != null && ev.pointerId !== id) return;
      ev.preventDefault();
      setDirectionFrom(ev.pageX, ev.pageY);
    };
    const onUp = (ev) => {
      if (id != null && ev.pointerId != null && ev.pointerId !== id) return;
      ev.preventDefault();
      active = false;
      id = null;
      joy.releasePointerCapture?.(ev.pointerId ?? undefined);
      reset();
    };

    joy.addEventListener('pointerdown', onDown, { passive: false });
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { passive: false });
    window.addEventListener('pointercancel', onUp, { passive: false });
    window.addEventListener('pointerleave', onUp, { passive: false });
  }

  /**
   * Lida com a entrada do usuário e o movimento de parallax.
   */
  handleInputAndParallax() {
    if (this.stopgame) return; // Não processa input se o jogo estiver parado.

    const p = this.player;
    if (!p) return; // Garante que o player existe.

    // Verifica o estado das teclas de direção.
    const right = this.cursors.right.isDown || this.touchRight;
    const left = this.cursors.left.isDown || this.touchLeft;
    const up = this.cursors.up.isDown || this.touchUp;
    const down = this.cursors.down.isDown || this.touchDown;

    // Lógica de movimento do jogador e cálculo do offset de parallax.
    if (right) {
      // O jogador permanece no centro, o cenário se move.
      this.parallax_offset = p.step; // Define o offset de parallax com base no passo do jogador.
      p.move_right(); // Aciona a animação de andar, mas o jogador não se moverá.
    } else if (left) {
      this.parallax_offset = -p.step; // Parallax reverso para a esquerda.
      p.move_left();
    } else {
      this.parallax_offset = 0; // Sem parallax se não estiver se movendo.
    }
    if (up) p.move_up();
    if (down) p.move_down();

    let action_triggered = false;
    // Verifica se a tecla Espaço foi pressionada (apenas uma vez por clique) ou botão touch A
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) || this.touchShootOnce) {
      p.move_atirar(); // Ativa a ação de atirar.
      action_triggered = true;
    }
    // Verifica se a tecla Ctrl foi pressionada (apenas uma vez por clique) ou botão touch B
    if (Phaser.Input.Keyboard.JustDown(this.keyCtrl) || this.touchAttackOnce) {
      p.move_attack(); // Ativa a ação de ataque.
      action_triggered = true;
    }
    // Consome triggers touch de um frame
    this.touchShootOnce = false;
    this.touchAttackOnce = false;

    // Se nenhuma tecla de movimento ou ação foi pressionada, o jogador para.
    if (!(up || down || left || right) && !action_triggered) {
      p.move_stopped();
    }

    // Aplica o efeito de parallax se houver um offset.
    if (this.parallax_offset !== 0) {
      const step = this.parallax_offset; // O passo do parallax.
      // Itera sobre todos os grupos de sprites e aplica o parallax.
      this.groupEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjPlayer.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjStatic.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));

      // Rola o fundo (bg1 e bg2) para criar o efeito contínuo.
      this.bg1.x -= step;
      this.bg2.x -= step;

      // Reposiciona as imagens de fundo quando saem da tela para criar um loop infinito.
      if (this.bg1.x < -this.bg1.displayWidth) this.bg1.x += this.bg1.displayWidth * 2;
      if (this.bg2.x < -this.bg2.displayWidth) this.bg2.x += this.bg2.displayWidth * 2;
      if (this.bg1.x > this.bg1.displayWidth) this.bg1.x -= this.bg1.displayWidth * 2;
      if (this.bg2.x > this.bg2.displayWidth) this.bg2.x -= this.bg2.displayWidth * 2;

      this.parallax_offset = 0; // Reseta o offset.
      if (step > 0) this.distance += step; // Aumenta a distância percorrida apenas para frente.
    }
  }

  /**
   * Método update é chamado a cada frame do jogo.
   * Contém a lógica principal do loop do jogo.
   */
  update() {
    // Lógica de Game Over: verifica se o jogador está inativo (morreu).
    if (this.player && !this.player.active) {
      if (!this.stopgame) {
        this.stopgame = true; // Para o jogo.
        // if (this.music && this.music.isPlaying) this.music.stop(); // Comentado: não há música de fundo.
        const overlay = document.getElementById('overlay');
        if (overlay) {
          overlay.style.display = 'flex'; // Reexibe o overlay de início.
        }
      }
    }

    this.generateEnemies(); // Gera inimigos e objetos.

    // Processa coletas e colisões entre os diferentes grupos de sprites.
    this.objectSpriteGet(this.groupPlayer, this.groupObjStatic); // Jogador coleta objetos estáticos.
    this.objectSpriteCollide(this.groupEnemy, this.groupObjPlayer); // Inimigos colidem com objetos do jogador.
    this.objectSpriteCollide(this.groupPlayer, this.groupObjEnemy); // Jogador colide com objetos do inimigo.
    this.playerEnemyAttackHit(); // Verifica ataques entre jogador e inimigos.

    this.handleInputAndParallax(); // Lida com input e parallax.

    // Chama o método customUpdate para cada sprite nos grupos.
    // Isso permite que cada sprite tenha sua própria lógica de atualização.
    this.groupPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate(this.groupPlayer, this.groupEnemy));
    this.groupObjPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjStatic.children.iterate((s) => s && s.customUpdate && s.customUpdate());

    this.updateHud(); // Atualiza o HUD.
  }
}