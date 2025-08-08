// config.js
// Módulo de constantes globais e funções utilitárias do jogo.
// Centraliza dimensões, estados, cores e helpers matemáticos.

// Dimensões do canvas do jogo
export const WIDTH = 800;
export const HEIGHT = 600;

// Fatores de escala e tamanhos
export const RESIZE_FACTOR = HEIGHT / 600;
export const FONT_SIZE = Math.floor(HEIGHT * 0.06);
export const SPRITE_LEVEL_Y_HIGH = HEIGHT * 0.70;

// Direções e estados
export const LEFT = 'Left';
export const RIGHT = 'Right';
export const UP = 'Up';
export const DOWN = 'Down';
export const STOPPED = 'Stopped';
export const MOONWALK = 'MoonWalk';

// Estados do jogo
export const DERIVACAO = 70; // Tolerância para colisão/alinhamento
export const STATE_INATTACK = 'In_Attack';
export const STATE_ATTACK = 'Attack';
export const STATE_STOP = 'Stop';
export const STATE_WALK = 'Walk';
export const STATE_MOONWALK = 'MoonWalk';
export const DIFICULT_AVANCE = 1000;
export const ENEMY_SPAWN_TICK_RESET = 100;
export const PARALLAX_START_THRESHOLD = 0.8;
export const WHITE = 0xffffff;
export const GAME_FPS = 25;

// Helpers matemáticos
/**
 * Calcula a distância euclidiana entre dois pontos.
 * @param {object} a - {x, y}
 * @param {object} b - {x, y}
 * @returns {number} Distância
 */
export function calcule_vetor_distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Verifica alinhamento vertical entre sprites.
 * @param {number} y1
 * @param {number} y2
 * @returns {boolean}
 */
export function verify_align(y1, y2) {
  return Math.abs(y1 - y2) <= DERIVACAO;
}

/**
 * Retorna o caminho relativo do asset, sem duplicar prefixos.
 * O Phaser já ajusta o baseURL conforme o ambiente.
 * @param {string} path Caminho relativo do asset
 * @returns {string} Caminho relativo
 */
export function resourcePath(path) {
  return path.replace(/^\/?/, '');
}