import Phaser from './lib/phaser.js';

import { SCENE_KEYS } from './keys/scene.js';

import { PreloadScene } from './scenes/preload.js';
import { MainScene } from './scenes/main.js';

const game = new Phaser.Game({
    type: Phaser.CANVAS,
    pixelArt: true,
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
game.scene.add(SCENE_KEYS.MAIN_SCENE, MainScene);
game.scene.start(SCENE_KEYS.PRELOAD_SCENE);
