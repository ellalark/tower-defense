import * as Phaser from 'phaser';

class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super('Placeholder');
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [PlaceholderScene],
};

export const game = new Phaser.Game(config);
