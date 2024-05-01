import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { Map, TILE_TYPE } from "../map.js";
import { MAIN_UI_ASSET_KEYS, MAP_ASSET_KEYS } from "../keys/asset.js";
import { StateMachine } from "../state-machine.js";
import { UNIT_ACTION_TYPES, UNIT_TYPES, Unit } from "../units/unit.js";
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
    /** @type {Phaser.GameObjects.Container} */
    #mapOverlayContainer;

    /** @type {StateMachine} */
    #stateMachine;

    /** @type {Unit[]} */
    #units;

    /** @type {Unit[]} */
    #unitsQueue;
    /** @type {Unit | undefined} */
    #currentUnitQueue;

    /** @type {Unit} */
    #selectedUnit;

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

        this.#mapContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.#mapContainer.getBounds().width, this.#mapContainer.getBounds().height),
            Phaser.Geom.Rectangle.Contains
        );

        this.#mapOverlayContainer = this.add.container(0, 0);
        this.#mapOverlayContainer.x = this.#mapContainer.x;
        this.#mapOverlayContainer.y = this.#mapContainer.y;
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
                actions: [{
                    type: UNIT_ACTION_TYPES.MOVE,
                    position: {
                        x: -1,
                        y: 0,
                    }
                },{
                    type: UNIT_ACTION_TYPES.MOVE,
                    position: {
                        x: 1,
                        y: 0,
                    }
                },{
                    type: UNIT_ACTION_TYPES.MOVE,
                    position: {
                        x: 0,
                        y: -1,
                    }
                },{
                    type: UNIT_ACTION_TYPES.MOVE,
                    position: {
                        x: 0,
                        y: 1,
                    }
                },{
                    type: UNIT_ACTION_TYPES.ATTACK_MELEE,
                    position: {
                        x: -1,
                        y: 0,
                    }
                },{
                    type: UNIT_ACTION_TYPES.ATTACK_MELEE,
                    position: {
                        x: 1,
                        y: 0,
                    }
                },{
                    type: UNIT_ACTION_TYPES.ATTACK_MELEE,
                    position: {
                        x: 0,
                        y: -1,
                    }
                },{
                    type: UNIT_ACTION_TYPES.ATTACK_MELEE,
                    position: {
                        x: 0,
                        y: 1,
                    }
                }],
            }
        }, { x: 1, y: 1 });
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
                actions: [],
            }
        }, { x: 1, y: 2 });
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
                if (!this.#selectedUnit) {
                    this.#selectUnit(this.#currentUnitQueue);
                }

                this.#enableMapClick();
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

    /**
     * @param {Unit} unit 
     */
    #selectUnit(unit) {
        this.#unselectUnit();

        this.#selectedUnit = unit;

        this.#createOverlay(
            unit.gameObject.x,
            unit.gameObject.y,
            MAIN_UI_ASSET_KEYS.SELECTED_UNIT
        );

        if (unit.type == UNIT_TYPES.PLAYER) {
            unit.actions.forEach((singleAction) => {
                const newPosition = {
                    x: unit.position.x + singleAction.position.x,
                    y: unit.position.y + singleAction.position.y,
                }

                if (singleAction.type === UNIT_ACTION_TYPES.MOVE) {
                    // Outside the map
                    if (!this.#map.isInBound(newPosition.x, newPosition.y)) {
                        return;
                    }

                    // Unwalkable floor
                    if (!this.#map.canMoveTo(newPosition.x, newPosition.y)) {
                        return;
                    }

                    // Can't move over an enemy
                    let enemy = this.#units.filter(singleUnit => singleUnit.position.x === newPosition.x && singleUnit.position.y == newPosition.y);
                    if (enemy.length > 0) {
                        return;
                    }
                    
                    this.#createOverlay(
                        unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                        unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                        MAIN_UI_ASSET_KEYS.MOVE
                    );
                    return;
                }
                if (singleAction.type === UNIT_ACTION_TYPES.ATTACK_MELEE) {
                    // Need an ennemy to attack
                    let enemy = this.#units.filter(singleUnit => singleUnit.position.x === newPosition.x && singleUnit.position.y == newPosition.y);
                    if (enemy.length === 0) {
                        return;
                    }

                    this.#createOverlay(
                        unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                        unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                        MAIN_UI_ASSET_KEYS.ATTACK_MELEE
                    );
                    return;
                }

                exhaustiveGuard(singleAction.type);
            });
        } else {
            console.log("SHOW STATUS: ", unit);
        }
    }

    #unselectUnit() {
        if (this.#selectedUnit) {
            this.#mapOverlayContainer.getAll().forEach((singleOverlay) => {
                singleOverlay.destroy();
            });
        }

        this.#selectedUnit = undefined;
    }

    #enableMapClick() {
        this.#mapContainer.off('pointerdown').on('pointerdown', (event) => {
            const x = Math.floor((event.worldX - this.#mapContainer.x) / 48);
            const y = Math.floor((event.worldY - this.#mapContainer.y) / 48);
            console.log(`Clicked on ${x}x${y}`);

            // Unselect the selected unit
            if (this.#selectedUnit !== undefined) {
                let unit = this.#units.filter(singleUnit => singleUnit.position.x === x && singleUnit.position.y === y && singleUnit === this.#selectedUnit);
                if (unit.length == 1) {
                    this.#unselectUnit();
                }
                return;
            }

            // Select an action

            

            // Select an unit
            let unit = this.#units.filter(singleUnit => singleUnit.position.x === x && singleUnit.position.y === y);
            if (unit.length == 1) {
                this.#selectUnit(unit[0]);
                return;
            }
        });
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {string} assetKey 
     * @return {Phaser.GameObjects.Image}
     */
    #createOverlay(x, y, assetKey) {
        const image = this.add.image(x, y, assetKey);
        image.setOrigin(0);
        this.#mapOverlayContainer.add(image);

        return image;
    }
}
