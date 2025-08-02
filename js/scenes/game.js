// Cena principal: porta lógica do loop, input, parallax, spawns e colisões
import {
  WIDTH, HEIGHT, GAME_FPS, PARALLAX_START_THRESHOLD, WHITE,
  DIFICULT_AVANCE, ENEMY_SPAWN_TICK_RESET, DERIVACAO,
  resourcePath, calcule_vetor_distance, verify_align,
  SPRITE_LEVEL_Y_HIGH
} from '../modules/config.js';

import { Player } from '../sprites/player.js';
import { Enemy1, Enemy2 } from '../sprites/enemy.js';
import { PedraPlayer, PedraEnemy, PedraParada, BandAid } from '../sprites/objects.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Estado equivalente a GameState
    this.enemy_spawn_timer = 0;
    this.parallax_offset = 0;
    this.stopgame = true;
    this.distance = 0;
    this.enemylist = ['enemy1', 'enemy2']; // mapeado para classes abaixo
    this.score = 0;
  }

  create() {
    // Fundo estático simples
    this.bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
    this.bgDisplayW = this.bg.width;
    this.bgScrollX = 0;

    // Removido áudio/música de fundo
    this.game.events.on('user-start', () => {
      if (this.stopgame) {
        this.stopgame = false;
        this.resetRun();
      }
    });

    // Grupos Arcade
    this.groupPlayer = this.physics.add.group();
    this.groupEnemy = this.physics.add.group();
    this.groupObjPlayer = this.physics.add.group();
    this.groupObjEnemy = this.physics.add.group();
    this.groupObjStatic = this.physics.add.group();

    // Player inicial invisível até start
    this.player = new Player(this, WIDTH / 2, HEIGHT * 0.65);
    this.groupPlayer.add(this.player);

    // HUD via DOM
    this.hudEl = document.getElementById('hud');
    this.updateHud();

    // Mensagens de input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyCtrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Colisões/overlaps (resolvidas manualmente por distância como no Pygame)
    // Arcade AABB não é usado para dano; usamos DERIVACAO

    // Loop de update manual com time events (Phaser chama update por frame)
    // Nada extra aqui.

    // Se o usuário apertar ENTER sem clicar
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.stopgame) this.game.events.emit('user-start');
    });
  }

  resetRun() {
    // Limpa grupos e estado, reinicia player
    this.groupEnemy.clear(true, true);
    this.groupObjEnemy.clear(true, true);
    this.groupObjPlayer.clear(true, true);
    this.groupObjStatic.clear(true, true);

    this.player.reset();
    this.score = 0;
    this.distance = 0;
    this.enemy_spawn_timer = 0;
    this.parallax_offset = 0;
    this.updateHud();
  }

  spawnEnemies(fator) {
    const count = Phaser.Math.Between(1, fator);
    for (let i = 0; i < count; i++) {
      const tipo = Phaser.Utils.Array.GetRandom(this.enemylist);
      const speedFactor = Math.floor(fator / 2);
      let enemy;
      if (tipo === 'enemy1') {
        enemy = new Enemy1(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 500, HEIGHT - 10), speedFactor);
      } else {
        enemy = new Enemy2(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 500, HEIGHT - 10), speedFactor);
      }
      this.groupEnemy.add(enemy);
    }
  }

  spawnObjects() {
    // Pedra parada
    const pedrasCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < pedrasCount; i++) {
      const p = new PedraParada(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(p);
    }
    // BandAid
    const bandCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < bandCount; i++) {
      const b = new BandAid(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(b);
    }
  }

  generateEnemies() {
    if (!this.stopgame) {
      if (this.enemy_spawn_timer === 0) {
        if (this.distance % DIFICULT_AVANCE === 0) {
          const fator = 1 + Math.floor(this.distance / DIFICULT_AVANCE);
          this.spawnEnemies(fator);
          this.spawnObjects();
          this.enemy_spawn_timer = ENEMY_SPAWN_TICK_RESET;
        }
      }
      this.enemy_spawn_timer = Math.max(0, this.enemy_spawn_timer - 1);
    }
  }

  objectSpriteCollide(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr) return;
      objectGroup.children.iterate((obj) => {
        if (!obj) return;
        const d = calcule_vetor_distance(spr.body.center, obj.body.center);
        if (d < DERIVACAO) {
          if (spr.move_hit) spr.move_hit(obj.damage || 1);
          obj.destroy();
        }
      });
    });
  }

  objectSpriteGet(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr) return;
      objectGroup.children.iterate((obj) => {
        if (!obj) return;
        const d = calcule_vetor_distance(spr.body.center, obj.body.center);
        if (d < DERIVACAO) {
          if (spr.get_object) spr.get_object(obj);
          obj.destroy();
        }
      });
    });
  }

  playerEnemyAttackHit() {
    this.groupPlayer.children.iterate((player) => {
      if (!player) return;
      this.groupEnemy.children.iterate((enemy) => {
        if (!enemy) return;
        if (player.check_attack_hit && player.check_attack_hit(enemy)) {
          this.score += enemy.speed || 1;
          if (enemy.move_hit) enemy.move_hit(player.calcule_hit ? player.calcule_hit() : 1);
        }
        if (enemy.check_attack_hit && enemy.check_attack_hit(player)) {
          if (player.move_hit) player.move_hit(enemy.calcule_hit ? enemy.calcule_hit() : 1);
        }
      });
    });
  }

  updateHud() {
    if (!this.hudEl) return;
    const pedras = this.player ? this.player.pedras : 0;
    const life = this.player ? this.player.life : 0;
    this.hudEl.textContent = `Placar: ${this.score}  Vida: ${life}  Pedras: ${pedras}`;
  }

  handleInputAndParallax() {
    if (this.stopgame) return;

    const p = this.player;
    if (!p) return;

    const right = this.cursors.right.isDown;
    const left = this.cursors.left.isDown;
    const up = this.cursors.up.isDown;
    const down = this.cursors.down.isDown;

    // Movimentos combinados no próprio Player
    if (right) {
      if (p.x > WIDTH * PARALLAX_START_THRESHOLD) {
        this.parallax_offset = p.step;
        p.move_moonwalk();
      } else {
        this.parallax_offset = 0;
        p.move_right();
      }
    }
    if (left) p.move_left();
    if (up) p.move_up();
    if (down) p.move_down();

    if (!(up || down || left || right)) {
      p.move_stopped();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      p.move_atirar();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyCtrl)) {
      p.move_attack();
    }

    if (this.parallax_offset > 0) {
      // Move todos objetos e fundo
      const step = this.parallax_offset;
      this.groupEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjPlayer.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjStatic.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));

      // Scroll background
      this.bgScrollX = (this.bgScrollX + step) % this.bgDisplayW;
      this.bg.x = -this.bgScrollX;

      this.parallax_offset = 0;
      this.distance += step;
    }
  }

  update() {
    // Game Over: se player morreu (removido do grupo)
    if (!this.player.active) {
      if (!this.stopgame) {
        this.stopgame = true;
        if (this.music.isPlaying) this.music.stop();
        // Reexibe overlay via DOM
        const overlay = document.getElementById('overlay');
        overlay.style.display = 'flex';
      }
    }

    this.generateEnemies();

    // Coletas e colisões
    this.objectSpriteGet(this.groupPlayer, this.groupObjStatic);
    this.objectSpriteCollide(this.groupEnemy, this.groupObjPlayer);
    this.objectSpriteCollide(this.groupPlayer, this.groupObjEnemy);
    this.playerEnemyAttackHit();

    // Atualiza entidades (Arcade chama preUpdate, mas temos update custom em classes)
    this.groupPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate(this.groupPlayer, this.groupEnemy));
    this.groupObjPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjStatic.children.iterate((s) => s && s.customUpdate && s.customUpdate());

    // Input/movimento e parallax
    this.handleInputAndParallax();

    // HUD
    this.updateHud();
  }
}