import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "./keys.js";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.PRELOAD_SCENE,
        });
    }

    preload() {
        // ...
    }

    create() {
        this.scene.start(SCENE_KEYS.MAP_SCENE);
    }
}
