import { MAP_ASSET_KEYS } from '../keys/asset.js';
import Phaser from '../lib/phaser.js';

/** @typedef {keyof typeof UNIT_TYPES} UnitTypes */
/** @enum {UnitTypes} */
export const UNIT_TYPES = Object.freeze({
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY',
});

/** @typedef {keyof typeof UNIT_ACTION_TYPES} UnitActionTypes */
/** @enum {UnitActionTypes} */
export const UNIT_ACTION_TYPES = Object.freeze({
    MOVE: 'MOVE',
    ATTACK_MELEE: 'ATTACK_MELEE',
});

export class Unit {
    /** @protected @type {Phaser.Scene} */
    _scene;

    /** @protected @type {import('../types/typedef.js').Coordinate} */
    _position;

    /** @protected @type {UNIT_TYPES} */
    _type;

    /** @protected @type {Phaser.GameObjects.Image} */
    _phaserGameObject;

    /** @protected @type {import('../types/typedef.js').UnitDetails} */
    _unitDetails;

    /** @protected @type {number} */
    _currentHp;
    /** @protected @type {number} */
    _maxHp;

    /** @protected @type {number} */
    _currentAp;
    /** @protected @type {number} */
    _maxAp;

    /** @protected @type {import('../types/typedef.js').UnitAction[]} */
    _actions;

    /**
     * @param {UNIT_TYPES} type
     * @param {import('../types/typedef.js').UnitConfig} config
     * @param {import('../types/typedef.js').Coordinate} position 
     */
    constructor(type, config, position) {
        this._type = type;
        this._scene = config.scene;
        this._position = position;
        this._unitDetails = config.unitDetails;

        this._currentHp = this._unitDetails.currentHp;
        this._maxHp = this._unitDetails.maxHp;

        this._currentAp = this._unitDetails.currentAp;
        this._maxAp = this._unitDetails.maxAp;

        this._actions = this._unitDetails.actions;

        this._phaserGameObject = this._scene.add.image(
            0, 0,
            this._unitDetails.assetKey,
            this._unitDetails.assetFrame || 0
        ).setOrigin(0).setScale(2);
        this._phaserGameObject.setPosition(position.x * this._phaserGameObject.displayWidth, position.y * this._phaserGameObject.displayHeight);
    }

    /** @type {import('../types/typedef.js').UnitAction[]} */
    get actions() {
        return this._actions;
    }

    /** @type {import('../types/typedef.js').Coordinate} */
    get position() {
        return this._position;
    }

    get hasAp() {
        return this._currentAp > 0;
    }

    /** @type {UNIT_TYPES} */
    get type() {
        return this._type;
    }

    /** @type {Phaser.GameObjects.Image} */
    get gameObject() {
        return this._phaserGameObject;
    }

    /** @type {boolean} */
    get isAlive() {
        return this._currentHp > 0;
    }

    /** @type {string} */
    get name() {
        return this._unitDetails.name;
    }

    /** @type {number} */
    get baseAttack() {
        return this._unitDetails.baseAttack;
    }

    /** @type {number} */
    get level() {
        return this._unitDetails.currentLevel;
    }

    /**
     * @param {number} damage 
     * @param {() => void} [callback] 
     */
    takeDamage(damage, callback) {
        this._currentHp -= damage;
        if (this._currentHp < 0) {
            this._currentHp = 0;
        }

        if (!this.isAlive) {
            this._currentAp = 0;
            this.gameObject.setTexture(MAP_ASSET_KEYS.EFFECTS_SMALL).setScale(1).setFrame(98);
        }
    }

    resetAp() {
        this._currentAp = this._maxAp;
    }

    useAp() {
        this._currentAp--;
        if (this._currentAp < 0) {
            this._currentAp = 0;
        }
    }

    move(x, y, callback) {
        this.position.x = x;
        this.position.y = y;

        this._scene.add.tween({
            targets: this._phaserGameObject,
            x: x * this._phaserGameObject.displayWidth,
            y: y * this._phaserGameObject.displayHeight,
            duration: 500,
            ease: Phaser.Math.Easing.Sine.Out,
            onComplete: callback,
        });
    }
}
