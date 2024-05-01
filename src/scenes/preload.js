import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.PRELOAD_SCENE,
        });
    }

    preload() {
        this.load.spritesheet(MAP_ASSET_KEYS.WORLD, 'assets/tilesets/world.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet(MAP_ASSET_KEYS.UNITS, 'assets/tilesets/units.png', {frameWidth: 24, frameHeight: 24});
    }

    create() {
        this.scene.start(SCENE_KEYS.MAP_SCENE);
    }
}
