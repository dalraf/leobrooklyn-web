// ui.js
// Cena dedicada à interface do usuário (UI) para futuras extensões.
// O HUD principal é gerenciado via DOM na GameScene.

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  /** Método create para elementos de UI futuros. */
  create() {
    // Exemplo de HUD Phaser (desativado, pois o HUD é DOM):
    /*
    this.scoreText = this.add.text(8, 8, 'Placar: 0  Vida: 0  Pedras: 0', {
      fontFamily: 'Sans-serif', fontSize: '16px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(1000);
    this.game.events.on('hud-update', (text) => this.scoreText.setText(text));
    */
  }
}