import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "./keys.js";

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
        // ...
    }
}
