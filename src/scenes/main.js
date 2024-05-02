import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { Map, TILE_TYPE } from "../map.js";
import { MAIN_UI_ASSET_KEYS, MAP_ASSET_KEYS } from "../keys/asset.js";
import { StateMachine } from "../state-machine.js";
import { UNIT_ACTION_TYPES, UNIT_DIRECTION, UNIT_TYPES, Unit } from "../units/unit.js";
import { exhaustiveGuard } from "../utils/guard.js";
import { Pathfinding } from "../pathfinding.js";
import { Panel } from "../panel.js";


const MAIN_STATES = Object.freeze({
    CREATE_MAP: 'CREATE_MAP',
    TURN_START: 'TURN_START',                                   // Build the Units Queue
    UNIT_START: 'UNIT_START',                                   // Wait for Action or Pick new Unit
    UNIT_WAIT_SELECTION: 'UNIT_WAIT_SELECTION',                 // Wait for a Player Selection
    UNIT_WAIT_ACTION: 'UNIT_WAIT_ACTION',                       // Wait for a Player action
    UNIT_AUTO_SELECT_ACTION: 'UNIT_AUTO_SELECT_ACTION',         // Select an action for Enemy
    UNIT_END: 'UNIT_END',
    TURN_END: 'TURN_END',                                       // Clear turn and start a new one
    GAME_OVER: 'GAME_OVER',                                     // You are dead
});

export class MainScene extends Phaser.Scene {
    /** @type {Map} */
    #map;
    /** @type {Phaser.GameObjects.Container} */
    #mapContainer;
    /** @type {Phaser.GameObjects.Container} */
    #mapOverlayContainer;

    /** @type {Panel} */
    #panel;

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
                name: 'Knight',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 100,
                maxAp: 1,
                currentAp: 0,
                baseAttack: 10,
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
        }, { x: 3, y: 1 });
        this.#mapContainer.add(player.gameObject);

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
        }, { x: 2, y: 2 });
        this.#mapContainer.add(enemy.gameObject);

        const enemy2 = new Unit(UNIT_TYPES.ENEMY, {
            scene: this,
            unitDetails: {
                name: 'Ghost',
                currentLevel: 1,
                maxHp: 10,
                currentHp: 10,
                maxAp: 2,
                currentAp: 0,
                baseAttack: 5,
                assetKey: MAP_ASSET_KEYS.UNITS,
                assetFrame: 294,
                actions: [],
            }
        }, { x: 2, y: 1 });
        this.#mapContainer.add(enemy2.gameObject);

        this.#units.push(player);
        this.#units.push(enemy);
        this.#units.push(enemy2);

        this.#units.forEach((singleUnit) => {
            singleUnit.gameObject.setInteractive();
            singleUnit.gameObject.on('pointerdown', () => {
                if (this.#stateMachine.currentStateName === MAIN_STATES.UNIT_WAIT_SELECTION) {
                    this.#selectUnit(singleUnit);
                    this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_ACTION);
                }
            });
        });
    }

    #createPanel() {
        this.#panel = new Panel(this);
        this.#panel.container.setPosition(0, 0);

        let player = this.#units.filter(singleUnit => singleUnit.type == UNIT_TYPES.PLAYER).shift();
        this.#panel.updateName(player.name);    
        this.#panel.updateHealthBar(player.currentHp, player.maxHp);
        console.log(player);
    }

    #createStateMachine() {
        this.#stateMachine = new StateMachine('MAIN', this);

        this.#stateMachine.addState({
            name: MAIN_STATES.CREATE_MAP,
            onEnter: () => {
                this.#createMap();
                this.#createUnits();
                this.#createPanel();

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
                    this.#stateMachine.setState(MAIN_STATES.GAME_OVER);
                    return;
                }

                unitsAlive.forEach((singleUnit) => {
                    // Reset the ActionPoint
                    singleUnit.resetAp();
                    // Add them into a queue
                    this.#unitsQueue.push(singleUnit);
                });

                // Pick the next unit
                this.#pickNextUnit();

                this.#stateMachine.setState(MAIN_STATES.UNIT_START);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.UNIT_START,
            onEnter: () => {
                // The player is dead
                let player = this.#units.filter(singleUnit => singleUnit.type == UNIT_TYPES.PLAYER).shift();
                if (!player.isAlive) {
                    this.#stateMachine.setState(MAIN_STATES.GAME_OVER);
                    return;
                }

                // Unit is done and no more remaining unit
                if (!this.#currentUnitQueue.hasAp && this.#unitsQueue.length == 0) {
                    this.#stateMachine.setState(MAIN_STATES.TURN_END);
                    return;
                }

                // Unit is done and pick a new unit
                if (!this.#currentUnitQueue.hasAp) {
                    // Pick the next unit
                    this.#pickNextUnit();
                }

                // Current unit is a player
                if (this.#currentUnitQueue.type == UNIT_TYPES.PLAYER) {
                    this.#selectUnit(this.#currentUnitQueue);
                    this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_ACTION);
                    return;
                }
                
                // Current unit is an enemy
                if (this.#currentUnitQueue.type == UNIT_TYPES.ENEMY) {
                    this.#stateMachine.setState(MAIN_STATES.UNIT_AUTO_SELECT_ACTION);
                    return;
                }

                exhaustiveGuard(this.#currentUnitQueue.type);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.UNIT_WAIT_SELECTION,
            onEnter: () => {
                if (!this.#currentUnitQueue.hasAp) {
                    this.#stateMachine.setState(MAIN_STATES.UNIT_START);
                    return;
                }
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.UNIT_WAIT_ACTION,
            onEnter: () => {

            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.UNIT_AUTO_SELECT_ACTION,
            onEnter: () => {
                if (!this.#currentUnitQueue.hasAp) {
                    this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                    return;
                }

                let player = this.#units.filter(singleUnit => singleUnit.type == UNIT_TYPES.PLAYER).shift();

                // Can attack the player ?
                // ----------------------------------------
                const distanceBetweenPlayer = this.#map.getDistanceBetween(
                    this.#currentUnitQueue.position,
                    player.position
                );
                if (distanceBetweenPlayer == 1) {
                    this.#attack_melee(this.#currentUnitQueue, player, () => {
                        this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                    });
                    return;
                }

                // Try to move closer to the player
                // ----------------------------------------

                // Get an array for the map (0 = Empty, 1 = Blocked)
                // TODO: 2 = Unit, 3 = Floor that can be cross by flying unit
                let grid = this.#map.export();
                // Disable enemy position in the grid
                this.#units.forEach((singleUnit) => {
                    // Don't care about dead unit...
                    if (!singleUnit.isAlive) {
                        return;
                    }
                    // Don't care about Player
                    if (singleUnit.type === UNIT_TYPES.PLAYER) {
                        return;
                    }
                    grid[(singleUnit.position.y * this.#map.width) + singleUnit.position.x] = 1;
                });

                // Get the paths between the unit and the player
                let pathFinding = new Pathfinding(grid, this.#map.width, this.#map.height);
                let paths = pathFinding.find(this.#currentUnitQueue.position, player.position);

                if (paths.length > 0) {
                    let nextPosition = paths.shift();

                    this.#currentUnitQueue.useAp();
                    this.#currentUnitQueue.move(nextPosition.x, nextPosition.y, () => {
                        this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                    });
                    return;
                }

                // Nothing to do? Waste the current AP
                // ----------------------------------------
                console.error(`${this.#currentUnitQueue.name} had nothing to do. Wasted an AP...`);
                this.#currentUnitQueue.useAp();
                this.#stateMachine.setState(MAIN_STATES.UNIT_END);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.UNIT_END,
            onEnter: () => {
                this.#stateMachine.setState(MAIN_STATES.UNIT_START);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.TURN_END,
            onEnter: () => {
                this.#stateMachine.setState(MAIN_STATES.TURN_START);
            },
        });

        this.#stateMachine.addState({
            name: MAIN_STATES.GAME_OVER,
            onEnter: () => {
                console.error('YOU ARE DEAD');
            },
        });

        this.#stateMachine.setState(MAIN_STATES.CREATE_MAP);
    }

    #pickNextUnit() {
        this.#currentUnitQueue = this.#unitsQueue.shift();

        // If the unit is alive, bring it on top of other units
        if (this.#currentUnitQueue.isAlive) {
            this.#mapContainer.bringToTop(this.#currentUnitQueue.gameObject);
        }
    }

    /**
     * @param {Unit} unit 
     */
    #selectUnit(unit) {
        this.#unselectUnit();

        this.#selectedUnit = unit;

        // Create an overlay to unselect the unit
        this.#createOverlay(
            unit.gameObject.x,
            unit.gameObject.y,
            MAIN_UI_ASSET_KEYS.SELECTED_UNIT,
            () => {
                this.#unselectUnit();
                this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_SELECTION);
            }
        );

        // Create player action
        if (unit.type === UNIT_TYPES.PLAYER) {
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

                    // Can't move over an alive enemy
                    let enemy = this.#units.filter(singleUnit => singleUnit.isAlive && singleUnit.position.x === newPosition.x && singleUnit.position.y == newPosition.y);
                    if (enemy.length > 0) {
                        return;
                    }
                    
                    this.#createOverlay(
                        unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                        unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                        MAIN_UI_ASSET_KEYS.MOVE,
                        () => {
                            this.#selectedUnit.useAp();

                            this.#unselectUnit();

                            this.#currentUnitQueue.move(newPosition.x, newPosition.y, () => {
                                this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                            });
                        }
                    );
                    return;
                }

                if (singleAction.type === UNIT_ACTION_TYPES.ATTACK_MELEE) {
                    // Need an ennemy to attack
                    let enemy = this.#units.filter(singleUnit => singleUnit.isAlive && singleUnit.position.x === newPosition.x && singleUnit.position.y == newPosition.y);
                    if (enemy.length === 0) {
                        return;
                    }

                    this.#createOverlay(
                        unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                        unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                        MAIN_UI_ASSET_KEYS.ATTACK_MELEE,
                        () => {
                            this.#unselectUnit();

                            this.#attack_melee(this.#currentUnitQueue, enemy[0], () => {
                                this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                            }); 
                        }
                    );
                    return;
                }

                exhaustiveGuard(singleAction.type);
            });

            return;
        }
        
        // Show unit information
        if (unit.type === UNIT_TYPES.ENEMY) {
            console.log("SHOW STATUS: ", unit);
            return;
        }

        exhaustiveGuard(unit.type);
    }

    #unselectUnit() {
        if (this.#selectedUnit) {
            this.#mapOverlayContainer.getAll().forEach((singleOverlay) => {
                singleOverlay.destroy();
            });
            this.#selectedUnit = undefined;
        }
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {string} assetKey 
     * @param {() => void} [callback] - Set the callback on pointerdown
     * @return {Phaser.GameObjects.Image}
     */
    #createOverlay(x, y, assetKey, callback) {
        const image = this.add.image(x, y, assetKey);
        image.setOrigin(0);
        this.#mapOverlayContainer.add(image);

        if (callback) {
            image.setInteractive();
            image.on('pointerdown', callback);
        }

        return image;
    }

    /**
     * @param {Unit} attacker 
     * @param {Unit} defender 
     * @param {() => void} [callback]
     */
    #attack_melee(attacker, defender, callback) {
        // Face forward the defender
        if (attacker.position.x < defender.position.x) {
            attacker.face(UNIT_DIRECTION.RIGHT);
        } else if (attacker.position.x > attacker.position.x) {
            attacker.face(UNIT_DIRECTION.LEFT);
        }

        attacker.useAp();

        var originalPosition = {
            x: attacker.gameObject.x,
            y: attacker.gameObject.y,
        }

        this.tweens.add({
            targets: attacker.gameObject,
            x: (attacker.gameObject.x + defender.gameObject.x) / 2,
            y: (attacker.gameObject.y + defender.gameObject.y) / 2,
            duration: 200,
            ease: Phaser.Math.Easing.Sine.Out,
            onComplete: () => {
                // TODO: Animation
                this.tweens.add({
                    targets: attacker.gameObject,
                    x: originalPosition.x,
                    y: originalPosition.y,
                    duration: 200,
                    ease: Phaser.Math.Easing.Sine.Out,
                    onComplete: () => {
                        defender.takeDamage(attacker.baseAttack);
                        
                        if (defender.type === UNIT_TYPES.PLAYER) {
                            this.#panel.updateHealthBar(defender.currentHp, defender.maxHp);
                        }

                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        });
    }
}
