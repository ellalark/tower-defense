import * as Phaser from 'phaser';
import { mainMenuPanel } from '../ui/components/MainMenuPanel.js';
import { mount } from '../ui/render.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#102030');

    this._ui = mount(document.getElementById('ui'), mainMenuPanel, {
      on: {
        'click [data-action="play"]': () => this.scene.start('MapSelect'),
        'click [data-action="settings"]': () => console.log('settings'),
        'click [data-action="quit"]': () => console.log('quit'),
      },
    });

    this.events.once('shutdown', () => this._ui.unmount());
  }
}
