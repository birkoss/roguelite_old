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
        this.#mapContainer.on('pointerdown', (target) => {
            let x = Math.floor((target.worldX - this.#mapContainer.x) / 48);
            let y = Math.floor((target.worldY - this.#mapContainer.y) / 48);

            this.#clickOnTile(x, y);
        });

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
                maxAp: 3,
                currentAp: 3,
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

        // this.#units.forEach((singleUnit) => {
        //     singleUnit.gameObject.setInteractive();
        //     singleUnit.gameObject.on('pointerdown', () => {
        //         if (this.#stateMachine.currentStateName === MAIN_STATES.UNIT_WAIT_SELECTION) {
        //             this.#selectUnit(singleUnit);
        //             this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_ACTION);
        //         }
        //     });
        // });
    }

    #createPanel() {
        this.#panel = new Panel(this);
        this.#panel.container.setPosition(0, 0);

        let player = this.#units.filter(singleUnit => singleUnit.type == UNIT_TYPES.PLAYER).shift();
        this.#panel.updateName(player.name);    
        this.#refreshPanel();
    }

    #createStateMachine() {
        this.#stateMachine = new StateMachine('MAIN', this);

        this.#stateMachine.addState({
            name: MAIN_STATES.CREATE_MAP,
            onEnter: () => {
                this.#createMap();
                this.#createUnits();
                this.#createPanel();
                this.#createAnimations();

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

                this.#refreshPanel();

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

    #createAnimations() {
        this.anims.create({
            key: "attack",
            frames: [{
                frame: 10,
                key: MAP_ASSET_KEYS.EFFECTS_LARGE
            },{
                frame: 11,
                key: MAP_ASSET_KEYS.EFFECTS_LARGE
            }],
            frameRate: 20,
            yoyo: true,
            repeat: 1,
        });
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

        // Create an overlay to show the selected unit
        this.#createOverlay(
            unit.gameObject.x,
            unit.gameObject.y,
            MAIN_UI_ASSET_KEYS.SELECTED_UNIT,
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
                    
                    // this.#createOverlay(
                    //     unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                    //     unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                    //     MAIN_UI_ASSET_KEYS.MOVE,
                    //     () => {
                    //         this.#selectedUnit.useAp();
                    //         this.#refreshPanel();

                    //         this.#unselectUnit();

                    //         this.#currentUnitQueue.move(newPosition.x, newPosition.y, () => {
                    //             this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                    //         });
                    //     }
                    // );

                    let x = unit.position.x + singleAction.position.x;
                    let y = unit.position.y + singleAction.position.y;
                    let index = (y * this.#map.width) + x;

                    this.#mapContainer.getAt(index).setTint(0x00FF00);

                    return;
                }

                if (singleAction.type === UNIT_ACTION_TYPES.ATTACK_MELEE) {
                    // Need an ennemy to attack
                    let enemy = this.#units.filter(singleUnit => singleUnit.isAlive && singleUnit.position.x === newPosition.x && singleUnit.position.y == newPosition.y);
                    if (enemy.length === 0) {
                        return;
                    }

                    let x = unit.position.x + singleAction.position.x;
                    let y = unit.position.y + singleAction.position.y;
                    let index = (y * this.#map.width) + x;

                    this.#mapContainer.getAt(index).setTint(0xFF0000);

                    // let attack = this.#createOverlay(
                    //     unit.gameObject.x+(singleAction.position.x * unit.gameObject.displayWidth),
                    //     unit.gameObject.y+(singleAction.position.y * unit.gameObject.displayHeight),
                    //     MAIN_UI_ASSET_KEYS.ACTIONS,
                    //     () => {
                    //         this.#unselectUnit();

                    //         this.#attack_melee(this.#currentUnitQueue, enemy[0], () => {
                    //             this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                    //         }); 
                    //     }
                    // );
                    // attack.setAlpha(0.8);
                    // this.tweens.add({
                    //     targets: attack,
                    //     scaleX: 0.5,
                    //     scaleY: 0.5,
                    //     // alpha: 1,
                    //     yoyo: true,
                    //     repeat: -1,
                    //     duration: 1200,
                    //     ease: Phaser.Math.Easing.Sine.InOut,
                    // });
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
            this.#mapContainer.getAll().forEach(singleTile => singleTile.setTint(0xFFFFFF));
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
        if (attacker.type == UNIT_TYPES.PLAYER) {
            this.#refreshPanel();
        }

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
                let effect = this.add.sprite(
                    defender.gameObject.x + defender.gameObject.displayWidth / 2,
                    defender.gameObject.y + defender.gameObject.displayHeight / 2,
                    MAP_ASSET_KEYS.EFFECTS_LARGE
                );
                this.#mapContainer.add(effect);
                effect.on("animationcomplete", (tween, sprite, element) => {
                    element.destroy();

                    defender.takeDamage(attacker.baseAttack);
                    // Update the player healthbar
                    if (defender.type === UNIT_TYPES.PLAYER) {
                        this.#refreshPanel();
                    }

                    // Move the attacker back
                    this.tweens.add({
                        targets: attacker.gameObject,
                        x: originalPosition.x,
                        y: originalPosition.y,
                        duration: 200,
                        ease: Phaser.Math.Easing.Sine.Out,
                        onComplete: () => {
                            if (callback) {
                                callback();
                            }
                        }
                    });
                });
                effect.anims.play("attack", true);
            }
        });
    }

    #refreshPanel() {
        console.log("RP...");
        let player = this.#units.filter(singleUnit => singleUnit.type == UNIT_TYPES.PLAYER).shift();

        this.#panel.updateHealthBar(player.currentHp, player.maxHp);
        this.#panel.updateActionPoints(player.currentAp, player.maxAp);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     */
    #clickOnTile(x, y) {
        console.log(`${x}x${y}`);

        console.log(this.#stateMachine.currentStateName);

        if (this.#stateMachine.currentStateName === MAIN_STATES.UNIT_WAIT_ACTION) {
            // Unselect the selected unit
            let unit = this.#units.filter(singleUnit => singleUnit.position.x === x && singleUnit.position.y === y).shift();
            if (unit === this.#selectedUnit) {
                this.#unselectUnit();
                this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_SELECTION);
                return;
            }

            let index = (y * this.#map.width) + x;
            if (this.#mapContainer.getAt(index).tint === 0x00FF00) {
                this.#selectedUnit.useAp();
                this.#refreshPanel();

                this.#unselectUnit();

                this.#currentUnitQueue.move(x, y, () => {
                    this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                });
                return;
            }

            if (this.#mapContainer.getAt(index).tint === 0xFF0000) {
                this.#unselectUnit();

                this.#attack_melee(this.#currentUnitQueue, unit, () => {
                    this.#stateMachine.setState(MAIN_STATES.UNIT_END);
                });
                return;
            }

            return;
        }
        if (this.#stateMachine.currentStateName === MAIN_STATES.UNIT_WAIT_SELECTION) {
            let unit = this.#units.filter(singleUnit => singleUnit.position.x === x && singleUnit.position.y === y).shift();
            if (unit !== undefined) {
                this.#selectUnit(unit);
                this.#stateMachine.setState(MAIN_STATES.UNIT_WAIT_ACTION);
            }

            return;
        }
    }
}
