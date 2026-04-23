import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale;
    const barWidth = 400;
    const barHeight = 24;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 - barHeight / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x222244);
    bg.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const fill = this.add.graphics();

    this.load.on('progress', (value) => {
      fill.clear();
      fill.fillStyle(0x44aaff);
      fill.fillRect(barX, barY, barWidth * value, barHeight);
    });

    this.load.image('td-tilesheet', 'sprites/kenny-td/Tilesheet/towerDefense_tilesheet.png');
  }

  create() {
    this.scene.start('MainMenu');
  }
}
