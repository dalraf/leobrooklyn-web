// ui.js
// Esta cena é dedicada à interface do usuário (UI).
// Atualmente, o HUD principal é gerenciado diretamente no DOM via `GameScene` para flexibilidade.
// No entanto, esta cena é mantida para futuras extensões, como menus de pausa, telas de game over,
// ou qualquer outro elemento de UI que possa ser renderizado diretamente no canvas do Phaser.

export class UIScene extends Phaser.Scene {
  constructor() {
    // Define a chave da cena e a marca como inativa por padrão, pois não precisa ser exibida imediatamente.
    super({ key: 'UIScene', active: false });
  }

  /**
   * O método create é chamado uma vez quando a cena é iniciada.
   * Aqui, poderíamos adicionar elementos de UI do Phaser, como texto, botões, etc.
   */
  create() {
    // Exemplo de como o HUD poderia ser implementado diretamente no Phaser,
    // caso se opte por não usar elementos DOM para o placar.
    /*
    this.scoreText = this.add.text(8, 8, 'Placar: 0  Vida: 0  Pedras: 0', {
      fontFamily: 'Sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(1000); // setScrollFactor(0) faz com que o texto não role com a câmera.

    // Exemplo de como escutar eventos para atualizar a UI, se um sistema de eventos for implementado.
    this.game.events.on('hud-update', (text) => this.scoreText.setText(text));
    */
  }
}