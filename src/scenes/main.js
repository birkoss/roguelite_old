import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";

export class MainScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.MAIN_SCENE,
        });
    }

    preload() {
        // ...
    }

    create() {
        for (var y=0; y<10; y++) {
            for (var x=0; x<10; x++) {
                const spriteFrame = (x == 0 || y == 0 || y == 9 || x == 9 ? 0 : 3);

                const background = this.add.sprite(0, 0, MAP_ASSET_KEYS.WORLD, spriteFrame);
                background.setPosition(x * background.displayWidth, y * background.displayHeight);
                background.setOrigin(0);
            }
        }

    }
}
