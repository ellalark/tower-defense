import * as Phaser from 'phaser';
import { createLocalStorageAdapter } from '../save/localStorageAdapter.js';
import { createSave } from '../save/save.js';
import { mapSelectPanel } from '../ui/components/MapSelectPanel.js';
import { mount } from '../ui/render.js';

const save = createSave(createLocalStorageAdapter());

export class MapSelectScene extends Phaser.Scene {
  constructor() {
    super('MapSelect');
  }

  create() {
    this.cameras.main.setBackgroundColor('#18283a');

    const { personalBests } = save.load();

    this._ui = mount(document.getElementById('ui'), () => mapSelectPanel({ personalBests }), {
      on: {
        'click [data-action="back"]': () => this.scene.start('MainMenu'),
        'click [data-action="select-map"]': (e) => {
          const { mapId } = e.target.closest('[data-map-id]').dataset;
          this.scene.start('Game', { mapId });
        },
      },
    });

    this.events.once('shutdown', () => this._ui.unmount());
  }
}
