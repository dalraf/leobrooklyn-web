// game.js
// Cena principal do jogo: gerencia loop, entrada, parallax, spawn, HUD e colisões.

import {
  WIDTH, HEIGHT, PARALLAX_START_THRESHOLD,
  DIFICULT_AVANCE, ENEMY_SPAWN_TICK_RESET, DERIVACAO, GAME_FPS,
  calcule_vetor_distance, SPRITE_LEVEL_Y_HIGH
} from '../modules/config.js';
import { Player } from '../sprites/player.js';
import { Enemy1, Enemy2 } from '../sprites/enemy.js';
import { PedraPlayer, PedraEnemy, PedraParada, BandAid } from '../sprites/objects.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.enemy_spawn_timer = 0;
    this.parallax_offset = 0;
    this.stopgame = true;
    this.distance = 0;
    this.enemylist = ['enemy1', 'enemy2'];
    this.score = 0;
    this.player = null;
    this.hudEl = null;
    this.cursors = null;
    this.keySpace = null;
    this.keyCtrl = null;
    this.keyEnter = null;
    this.music = null;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchUp = false;
    this.touchDown = false;
    this.touchShootOnce = false;
    this.touchAttackOnce = false;
  }

  /** Inicializa objetos, grupos, HUD, controles e listeners. */
  create() {
    this.sound.unlock();
    this.bg1 = this.add.image(0, 0, 'bg').setOrigin(0, 0);
    this.bg1.displayHeight = HEIGHT;
    this.bg1.displayWidth = this.bg1.width * (HEIGHT / this.bg1.height);
    this.bg2 = this.add.image(this.bg1.displayWidth, 0, 'bg').setOrigin(0, 0);
    this.bg2.displayHeight = HEIGHT;
    this.bg2.displayWidth = this.bg1.displayWidth;
    const reflowBackground = () => {
      this.bg1.displayHeight = HEIGHT;
      this.bg1.displayWidth = this.bg1.width * (HEIGHT / this.bg1.height);
      this.bg1.x = 0;
      this.bg1.y = 0;
      this.bg2.displayHeight = HEIGHT;
      this.bg2.displayWidth = this.bg1.displayWidth;
      this.bg2.x = this.bg1.displayWidth;
      this.bg2.y = 0;
    };
    this.scale.on('resize', reflowBackground);
    reflowBackground();
    this.game.events.on('user-start', () => {
      if (this.stopgame) {
        this.scene.resume('GameScene');
        this.stopgame = false;
        this.resetRun();
        if (this.music) this.music.stop();
        if (this.sound.context.state === 'suspended') this.sound.context.resume();
        this.music = this.sound.add('music', { loop: true });
        this.music.play();
      }
    });
    this.groupPlayer = this.physics.add.group();
    this.groupEnemy = this.physics.add.group();
    this.groupObjPlayer = this.physics.add.group();
    this.groupObjEnemy = this.physics.add.group();
    this.groupObjStatic = this.physics.add.group();
    this._initPlayer();
    this.registry.set('Class:PedraPlayer', PedraPlayer);
    this.hudEl = document.getElementById('hud');
    this.hudScoreEl = document.getElementById('hudScore') || null;
    this.hudLifeEl = document.getElementById('hudLife') || null;
    this.hudRocksEl = document.getElementById('hudRocks') || null;
    this.updateHud();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyCtrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.stopgame) this.game.events.emit('user-start');
    });
    this._setupTouchControls();
    this._setupJoystick();
  }

  /** Inicializa ou reinicializa o objeto Player. */
  _initPlayer() {
    if (this.player) this.player.destroy();
    this.player = new Player(this, WIDTH / 2, HEIGHT);
    this.groupPlayer.add(this.player);
  }

  /** Reseta o estado do jogo para um novo início. */
  resetRun() {
    this.groupEnemy.clear(true, true);
    this.groupObjEnemy.clear(true, true);
    this.groupObjPlayer.clear(true, true);
    this.groupObjStatic.clear(true, true);
    this._initPlayer();
    this.score = 0;
    this.distance = 0;
    this.enemy_spawn_timer = 0;
    this.parallax_offset = 0;
    this.updateHud();
  }

  /** Spawna inimigos na cena com base na dificuldade. */
  spawnEnemies(fator) {
    const tipo = Phaser.Utils.Array.GetRandom(this.enemylist);
    const speedFactor = Math.floor(fator / 2);
    let enemy;
    if (tipo === 'enemy1') {
      enemy = new Enemy1(this, WIDTH + 10, Phaser.Math.Between(SPRITE_LEVEL_Y_HIGH, HEIGHT - 50), speedFactor);
    } else {
      enemy = new Enemy2(this, WIDTH + 10, Phaser.Math.Between(SPRITE_LEVEL_Y_HIGH, HEIGHT - 50), speedFactor);
    }
    this.groupEnemy.add(enemy);
  }

  /** Spawna objetos estáticos (PedraParada e BandAid). */
  spawnObjects() {
    const pedrasCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < pedrasCount; i++) {
      const p = new PedraParada(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(p);
    }
    const bandCount = Phaser.Math.Between(0, 1);
    for (let i = 0; i < bandCount; i++) {
      const b = new BandAid(this, WIDTH + 10, Phaser.Math.Between(HEIGHT - 150, HEIGHT - 30));
      this.groupObjStatic.add(b);
    }
  }

  /** Gerencia a lógica de geração de inimigos e objetos. */
  generateEnemies() {
    if (this.stopgame) return;
    this.enemy_spawn_timer = Math.max(0, this.enemy_spawn_timer - 1);
    if (this.enemy_spawn_timer === 0) {
      const enemyCount = this.groupEnemy ? this.groupEnemy.countActive(true) : 0;
      if (enemyCount < 10) {
        const fator = 1 + Math.floor(this.distance / DIFICULT_AVANCE);
        this.spawnEnemies(fator);
      }
      if (Phaser.Math.Between(1, 5) === 1) this.spawnObjects();
      const baseSpawnTime = ENEMY_SPAWN_TICK_RESET;
      const minSpawnTime = GAME_FPS;
      const fatorTmp = 1 + Math.floor(this.distance / DIFICULT_AVANCE);
      const newSpawnTime = Math.max(minSpawnTime, baseSpawnTime - (fatorTmp * 4));
      this.enemy_spawn_timer = newSpawnTime;
    }
  }

  /** Lida com colisões entre sprites e objetos, aplicando dano. */
  objectSpriteCollide(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr || !spr.active) return;
      objectGroup.children.iterate((obj) => {
        if (!obj || !obj.active) return;
        const d = calcule_vetor_distance(spr.body.center, obj.body.center);
        if (d < DERIVACAO) {
          if (spr.move_hit) spr.move_hit(obj.damage || 1);
          obj.destroy();
        }
      });
    });
  }

  /** Lida com coleta de objetos por sprites. */
  objectSpriteGet(spriteGroup, objectGroup) {
    spriteGroup.children.iterate((spr) => {
      if (!spr || !spr.active) return;
      objectGroup.children.iterate((obj) => {
        if (!obj || !obj.active) return;
        const d = calcule_vetor_distance(spr.body.center, obj.body.center);
        if (d < DERIVACAO) {
          if (spr.get_object) spr.get_object(obj);
          obj.destroy();
        }
      });
    });
  }

  /** Lida com colisões de ataque entre jogador e inimigos. */
  playerEnemyAttackHit() {
    this.groupPlayer.children.iterate((player) => {
      if (!player || !player.active) return;
      this.groupEnemy.children.iterate((enemy) => {
        if (!enemy || !enemy.active) return;
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

  /** Atualiza o HUD com pontuação, vida e pedras. */
  updateHud() {
    if (!this.hudEl) return;
    const pedras = this.player ? this.player.pedras : 0;
    const life = this.player ? this.player.life : 0;
    if (this.hudScoreEl && this.hudLifeEl && this.hudRocksEl) {
      this.hudScoreEl.textContent = String(this.score);
      this.hudLifeEl.textContent = String(life);
      this.hudRocksEl.textContent = String(pedras);
    } else {
      this.hudEl.textContent = `Placar: ${this.score}  Vida: ${life}  Pedras: ${pedras}`;
    }
  }

  /** Configura listeners para controles touch no DOM. */
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

  /** Configura o joystick (base circular + knob) com arraste e zona morta. */
  _setupJoystick() {
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joy-knob');
    if (!joy || !knob) return;
    const rectFor = () => joy.getBoundingClientRect();
    const center = () => {
      const r = rectFor();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: Math.min(r.width, r.height) / 2 };
    };
    const deadZone = 0.18;
    const maxKnobOffset = 0.42;
    let active = false;
    let id = null;
    const setDirectionFrom = (pageX, pageY) => {
      const { cx, cy, radius } = center();
      const dx = pageX - cx;
      const dy = pageY - cy;
      const mag = Math.hypot(dx, dy);
      const norm = mag > 0 ? Math.min(1, mag / radius) : 0;
      let vx = norm > 0 ? dx / mag : 0;
      let vy = norm > 0 ? dy / mag : 0;
      if (norm < deadZone) { vx = 0; vy = 0; }
      this.touchLeft = vx < -0.35;
      this.touchRight = vx > 0.35;
      this.touchUp = vy < -0.35;
      this.touchDown = vy > 0.35;
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

  /** Lida com entrada do usuário e parallax. */
  handleInputAndParallax() {
    if (this.stopgame) return;
    const p = this.player;
    if (!p) return;
    const right = this.cursors.right.isDown || this.touchRight;
    const left = this.cursors.left.isDown || this.touchLeft;
    const up = this.cursors.up.isDown || this.touchUp;
    const down = this.cursors.down.isDown || this.touchDown;
    if (right) { this.parallax_offset = p.step; p.move_right(); }
    else if (left) { this.parallax_offset = -p.step; p.move_left(); }
    else { this.parallax_offset = 0; }
    if (up) p.move_up();
    if (down) p.move_down();
    let action_triggered = false;
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) || this.touchShootOnce) {
      p.move_atirar(); action_triggered = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyCtrl) || this.touchAttackOnce) {
      p.move_attack(); action_triggered = true;
    }
    this.touchShootOnce = false;
    this.touchAttackOnce = false;
    if (!(up || down || left || right) && !action_triggered) p.move_stopped();
    if (this.parallax_offset !== 0) {
      const step = this.parallax_offset;
      this.groupEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjPlayer.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjEnemy.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.groupObjStatic.children.iterate((obj) => obj && obj.paralaxe && obj.paralaxe(step));
      this.bg1.x -= step;
      this.bg2.x -= step;
      if (this.bg1.x < -this.bg1.displayWidth) this.bg1.x += this.bg1.displayWidth * 2;
      if (this.bg2.x < -this.bg2.displayWidth) this.bg2.x += this.bg2.displayWidth * 2;
      if (this.bg1.x > this.bg1.displayWidth) this.bg1.x -= this.bg1.displayWidth * 2;
      if (this.bg2.x > this.bg2.displayWidth) this.bg2.x -= this.bg2.displayWidth * 2;
      this.parallax_offset = 0;
      if (step > 0) this.distance += step;
    }
  }

  /** Loop principal do jogo, chamado a cada frame. */
  update() {
    if (this.player && !this.player.active) {
      if (!this.stopgame) {
        this.stopgame = true;
        if (this.music && this.music.isPlaying) this.music.stop();
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'flex';
      }
    }
    this.generateEnemies();
    this.objectSpriteGet(this.groupPlayer, this.groupObjStatic);
    this.objectSpriteCollide(this.groupEnemy, this.groupObjPlayer);
    this.objectSpriteCollide(this.groupPlayer, this.groupObjEnemy);
    this.playerEnemyAttackHit();
    this.handleInputAndParallax();
    this.groupPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate(this.groupPlayer, this.groupEnemy));
    this.groupObjPlayer.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjEnemy.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.groupObjStatic.children.iterate((s) => s && s.customUpdate && s.customUpdate());
    this.updateHud();
  }
}