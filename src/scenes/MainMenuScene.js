import * as Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#102030');
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Main Menu', {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
