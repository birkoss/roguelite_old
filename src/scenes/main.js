import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { Map, TILE_TYPE } from "../map.js";
import { MAP_ASSET_KEYS } from "../keys/asset.js";
import { StateMachine } from "../state-machine.js";
import { UNIT_TYPES, Unit } from "../units/unit.js";
import { exhaustiveGuard } from "../utils/guard.js";

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
    #units;

    /** @type {Unit[]} */
    #unitsQueue;

    /** @type {Unit | undefined} */
    #currentUnitQueue;

    constructor() {
        super({
            key: SCENE_KEYS.MAIN_SCENE,
        });

        this.#unitsQueue = [];
        this.#units = [];
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
    }

    #createUnits() {
        const player = new Unit(UNIT_TYPES.PLAYER, {
            scene: this,
            unitDetails: {
                name: 'Archer',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 10,
                maxAp: 3,
                currentAp: 0,
                baseAttack: 5,
                assetKey: MAP_ASSET_KEYS.UNITS,
                assetFrame: 0,
                attackIds: [],
            }
        }, { x: 5, y: 5 });
        this.#mapContainer.add(player.gameObject);
        this.#units.push(player);

        const enemy = new Unit(UNIT_TYPES.ENEMY, {
            scene: this,
            unitDetails: {
                name: 'Skeleton',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 10,
                maxAp: 3,
                currentAp: 0,
                baseAttack: 5,
                assetKey: MAP_ASSET_KEYS.UNITS,
                assetFrame: 290,
                attackIds: [],
            }
        }, { x: 3, y: 3 });
        this.#mapContainer.add(enemy.gameObject);
        this.#units.push(enemy);
    }

    #createStateMachine() {
        this.#stateMachine = new StateMachine('MAIN', this);

        this.#stateMachine.addState({
            name: MAIN_STATES.CREATE_MAP,
            onEnter: () => {
                this.#createMap();

                this.#createUnits();

                this.time.delayedCall(500, () => {
                    this.#stateMachine.setState(MAIN_STATES.TURN_START);
                });
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.TURN_START,
            onEnter: () => {
                this.#currentUnitQueue = undefined;

                // Get all units alives
                // TODO: Sort them by SPEED
                const unitsAlive = this.#units.filter(singleUnit => singleUnit.isAlive);
                if (unitsAlive.length == 0) {
                    // TODO: Should not appends, but in case...
                    return;
                }

                // Add them into a queue
                unitsAlive.forEach((singleUnit) => {
                    // Reset the ActionPoint
                    singleUnit.resetAp();

                    this.#unitsQueue.push(singleUnit);
                });

                this.#stateMachine.setState(MAIN_STATES.CHANGE_UNIT);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.CHANGE_UNIT,
            onEnter: () => {
                // No more units
                if (this.#unitsQueue.length == 0) {
                    this.#stateMachine.setState(MAIN_STATES.TURN_END);
                    return;
                }

                // Get the next one
                this.#currentUnitQueue = this.#unitsQueue.shift();

                if (this.#currentUnitQueue.type == UNIT_TYPES.PLAYER) {
                    this.#stateMachine.setState(MAIN_STATES.PLAYER_INPUT);
                    return;
                }
                
                if (this.#currentUnitQueue.type == UNIT_TYPES.ENEMY) {
                    this.#stateMachine.setState(MAIN_STATES.ENEMY_INPUT);
                    return;
                }

                exhaustiveGuard(this.#currentUnitQueue.type);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.PLAYER_INPUT,
            onEnter: () => {
                if (!this.#currentUnitQueue.hasAp) {
                    this.#stateMachine.setState(MAIN_STATES.CHANGE_UNIT);
                    return;
                }

                // Wait for move

            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.ENEMY_INPUT,
            onEnter: () => {
                if (!this.#currentUnitQueue.hasAp) {
                    this.#stateMachine.setState(MAIN_STATES.CHANGE_UNIT);
                    return;
                }

                // Pick a move
            },
        });

        this.#stateMachine.setState(MAIN_STATES.CREATE_MAP);
    }
}
