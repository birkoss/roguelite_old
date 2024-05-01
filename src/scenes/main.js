import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { Map, TILE_TYPE } from "../map.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";
import { StateMachine } from "../state-machine.js";
import { Unit } from "../units/unit.js";

const MAIN_STATES = Object.freeze({
    CREATE_MAP: 'CREATE_MAP',
    TURN_START: 'TURN_START',
    CHANGE_UNIT: 'CHANGE_UNIT',
    PLAYER_INPUT: 'PLAYER_INPUT',
    ENEMY_INPUT: 'ENEMY_INPUT',
    TURN_END: 'TURN_END',
});

export class MainScene extends Phaser.Scene {
    /** @type {Map} */
    #map;
    /** @type {Phaser.GameObjects.Container} */
    #mapContainer;

    /** @type {StateMachine} */
    #stateMachine;

    /** @type {Unit[]} */
    #unitsQueue;

    constructor() {
        super({
            key: SCENE_KEYS.MAIN_SCENE,
        });

        this.#unitsQueue = [];
    }

    create() {
        this.#createStateMachine();
    }

    update() {
        this.#stateMachine.update();
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

        const player = new Unit({
            scene: this,
            unitDetails: {
                name: 'Archer',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 10,
                baseAttack: 5,
                assetKey: MAP_ASSET_KEYS.UNITS,
                assetFrame: 0,
                attackIds: [],
            }
        }, { x: 5, y: 5 });
        this.#mapContainer.add(player.gameObject);

        const enemy = new Unit({
            scene: this,
            unitDetails: {
                name: 'Skeleton',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 10,
                baseAttack: 5,
                assetKey: MAP_ASSET_KEYS.UNITS,
                assetFrame: 290,
                attackIds: [],
            }
        }, { x: 3, y: 3 });
        this.#mapContainer.add(enemy.gameObject);
    }

    #createStateMachine() {
        this.#stateMachine = new StateMachine('MAIN', this);

        this.#stateMachine.addState({
            name: MAIN_STATES.CREATE_MAP,
            onEnter: () => {
                this.#createMap();

                this.time.delayedCall(500, () => {
                    this.#stateMachine.setState(MAIN_STATES.TURN_START);
                });
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.TURN_START,
            onEnter: () => {
                // Get all units alives
                // Sort them by speed
                // Add them into a queue

                // ChangeUnit
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.CHANGE_UNIT,
            onEnter: () => {
                // If no more units
                // - TURN_END

                // Remove the first unit
                // - If player - PLAYER_INPUT
                // - else - ENEMY_INPUT
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.PLAYER_INPUT,
            onEnter: () => {
                // If no move left
                // - CHANGE_UNIT

                // Wait for move
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.ENEMY_INPUT,
            onEnter: () => {
                // If no move left
                // - CHANGE_UNIT

                // Pick a move
            },
        });

        this.#stateMachine.setState(MAIN_STATES.CREATE_MAP);
    }
}
