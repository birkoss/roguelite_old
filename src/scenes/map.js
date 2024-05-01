import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.MAP_SCENE,
        });
    }

    preload() {
        // ...
    }

    create() {
        this.background = this.add.sprite(0, 0, MAP_ASSET_KEYS.WORLD, 0);
        this.background.setOrigin(0);
    }
}
