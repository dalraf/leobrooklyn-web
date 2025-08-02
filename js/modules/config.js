// config.js
// Este módulo contém constantes e funções utilitárias globais para o jogo.
// É o equivalente ao arquivo config.py em uma estrutura Python, adaptado para JavaScript.

// Dimensões do jogo
export const WIDTH = 800; // Largura padrão do canvas do jogo.
export const HEIGHT = 600; // Altura padrão do canvas do jogo.

// Fatores de escala e tamanhos
export const RESIZE_FACTOR = HEIGHT / 600; // Fator de redimensionamento baseado na altura padrão.
export const FONT_SIZE = Math.floor(HEIGHT * 0.06); // Tamanho da fonte calculado proporcionalmente à altura.
export const SPRITE_LEVEL_Y_HIGH = HEIGHT * 0.70; // Posição Y superior para sprites (ex: linha do chão).

// Constantes de direção e estado de movimento
export const LEFT = 'Left'; // Direção: Esquerda.
export const RIGHT = 'Right'; // Direção: Direita.
export const UP = 'Up'; // Direção: Cima.
export const DOWN = 'Down'; // Direção: Baixo.
export const STOPPED = 'Stopped'; // Estado de movimento: Parado.
export const MOONWALK = 'MoonWalk'; // Estado de movimento: Moonwalk (movimento para trás mantendo a frente).

// Constantes de jogo
export const DERIVACAO = 40; // Tolerância para colisões ou alinhamento (distância máxima para considerar colisão/alinhamento).
export const STATE_INATTACK = 'In_Attack'; // Estado de ataque: Iniciando ataque.
export const STATE_ATTACK = 'Attack'; // Estado de ataque: Ataque ativo.
export const STATE_STOP = 'Stop'; // Estado: Parado.
export const STATE_WALK = 'Walk'; // Estado: Andando.
export const STATE_MOONWALK = 'MoonWalk'; // Estado: Moonwalk.
export const DIFICULT_AVANCE = 1000; // Distância para aumentar a dificuldade do jogo.
export const ENEMY_SPAWN_TICK_RESET = 100; // Tempo de reset para o spawn de inimigos.
export const PARALLAX_START_THRESHOLD = 0.8; // Limite horizontal para iniciar o efeito parallax (0.0 a 1.0 da largura da tela).
export const WHITE = 0xffffff; // Cor branca em formato hexadecimal.
export const GAME_FPS = 25; // Frames por segundo do jogo.

// Funções utilitárias (Helpers)

/**
 * Calcula a distância euclidiana entre dois pontos (vetores).
 * @param {object} a - Primeiro ponto com propriedades x e y.
 * @param {object} b - Segundo ponto com propriedades x e y.
 * @returns {number} A distância entre os dois pontos.
 */
export function calcule_vetor_distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy); // Retorna a hipotenusa (distância).
}

/**
 * Verifica se dois valores Y estão alinhados dentro de uma margem de tolerância (DERIVACAO).
 * Usado para verificar alinhamento vertical entre sprites.
 * @param {number} y1 - Posição Y do primeiro sprite.
 * @param {number} y2 - Posição Y do segundo sprite.
 * @returns {boolean} Verdadeiro se os Ys estiverem alinhados, falso caso contrário.
 */
export function verify_align(y1, y2) {
  return Math.abs(y1 - y2) <= DERIVACAO;
}

/**
 * Constrói o caminho relativo para um recurso (imagem ou som).
 * Assume que os assets estão em 'images/' e 'sounds/' um nível acima do diretório 'js/'.
 * @param {string} rel - O caminho relativo do recurso (ex: 'images/bg.png').
 * @returns {string} O caminho completo para o recurso.
 */
export function resourcePath(rel) {
  return `${rel}`;
}