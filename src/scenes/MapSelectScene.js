import * as Phaser from 'phaser';

export class MapSelectScene extends Phaser.Scene {
  constructor() {
    super('MapSelect');
  }

  create() {
    this.cameras.main.setBackgroundColor('#203040');
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Map Select (stub)', {
        fontSize: '36px',
        color: '#e0f0ff',
      })
      .setOrigin(0.5);
  }
}
