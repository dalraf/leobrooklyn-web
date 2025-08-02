// Cena de UI: atualmente HUD é DOM, mas mantemos cena para extensões futuras (pause, overlays etc.)
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    // Exemplo: poderíamos adicionar textos Phaser aqui, se preferir não usar DOM.
    // this.scoreText = this.add.text(8, 8, 'Placar: 0  Vida: 0  Pedras: 0', {
    //   fontFamily: 'Sans-serif',
    //   fontSize: '16px',
    //   color: '#ffffff',
    // }).setScrollFactor(0).setDepth(1000);

    // Escuta eventos para atualizar UI (se adotarmos eventos mais tarde)
    // this.game.events.on('hud-update', (text) => this.scoreText.setText(text));
  }
}