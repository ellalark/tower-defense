import * as Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.mapId = data?.mapId ?? null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a1a0a');

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, `Game — ${this.mapId}`, {
        fontSize: '36px',
        color: '#e0f0ff',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
