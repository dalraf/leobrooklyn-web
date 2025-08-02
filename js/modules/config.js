// Config equivalente ao config.py para Phaser (JS)
export const WIDTH = 800;
export const HEIGHT = 600;
export const RESIZE_FACTOR = HEIGHT / 600;
export const FONT_SIZE = Math.floor(HEIGHT * 0.06);
export const SPRITE_LEVEL_Y_HIGH = HEIGHT * 0.70;
export const LEFT = 'Left';
export const RIGHT = 'Right';
export const UP = 'Up';
export const DOWN = 'Down';
export const STOPPED = 'Stopped';
export const MOONWALK = 'MoonWalk';
export const DERIVACAO = 40;
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

// Helpers equivalentes
export function calcule_vetor_distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
export function verify_align(y1, y2) {
  return Math.abs(y1 - y2) <= DERIVACAO;
}

// resource_path: agora as imagens e sons foram copiados para docs/web/images e docs/web/sounds
// Portanto, a partir de docs/web/js/* o caminho relativo é ../images e ../sounds
export function resourcePath(rel) {
  return `../${rel}`;
}