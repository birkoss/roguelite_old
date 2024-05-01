import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { Map, TILE_TYPE } from "../map.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";

export class MainScene extends Phaser.Scene {
    /** @type {Map} */
    #map;
    /** @type {Phaser.GameObjects.Container} */
    #mapContainer;

    constructor() {
        super({
            key: SCENE_KEYS.MAIN_SCENE,
        });
    }

    create() {
        this.#createMap();
    }

    #createMap() {
        this.#map = new Map(10, 8);

        this.#mapContainer = this.add.container(0, 0);

        this.#map.tiles.forEach((single_tile) => {
            const image = this.add.sprite(single_tile.x * 48, single_tile.y * 48, MAP_ASSET_KEYS.WORLD, single_tile.type == TILE_TYPE.BORDER ? 0 : 3);
            image.setOrigin(0);
            this.#mapContainer.add(image);
        });

        this.#mapContainer.setPosition(this.scale.width - this.#mapContainer.getBounds().width, 0);

        const player = this.add.sprite(5 * 48, 5 * 48, MAP_ASSET_KEYS.UNITS, 0);
        player.setScale(2);
        player.setOrigin(0);
        this.#mapContainer.add(player);

        const enemy = this.add.sprite(3 * 48, 3 * 48, MAP_ASSET_KEYS.UNITS, 290);
        enemy.setScale(2);
        enemy.setOrigin(0);
        this.#mapContainer.add(enemy);
    }

}
