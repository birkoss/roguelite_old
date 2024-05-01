import Phaser from './lib/phaser.js';

import { SCENE_KEYS } from './scenes/keys.js';

import { PreloadScene } from './scenes/preload.js';
import { MapScene } from './scenes/map.js';

const game = new Phaser.Game({
    type: Phaser.CANVAS,
    pixelArt: false,
    scale: {
        parent: 'game-container',
        width: 1024,
        height: 576,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: '#000000',

});

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.add(SCENE_KEYS.MAP_SCENE, MapScene);
game.scene.start(SCENE_KEYS.PRELOAD_SCENE);
