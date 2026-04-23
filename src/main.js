import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  scene: [BootScene, PreloadScene, MainMenuScene],
};

export const game = new Phaser.Game(config);
