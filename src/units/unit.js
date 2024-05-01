import Phaser from '../lib/phaser.js';

/** @typedef {keyof typeof UNIT_TYPES} UnitTypes */
/** @enum {UnitTypes} */
export const UNIT_TYPES = Object.freeze({
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY',
});

export class Unit {
    /** @protected @type {Phaser.Scene} */
    _scene;

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

    /**
     * @param {UNIT_TYPES} type
     * @param {import('../types/typedef.js').UnitConfig} config
     * @param {import('../types/typedef.js').Coordinate} position 
     */
    constructor(type, config, position) {
        this._type = type;
        this._scene = config.scene;
        this._unitDetails = config.unitDetails;

        this._currentHp = this._unitDetails.currentHp;
        this._maxHp = this._unitDetails.maxHp;

        this._currentAp = this._unitDetails.currentAp;
        this._maxAp = this._unitDetails.maxAp;

        this._monsterAttacks = [];

        this._phaserGameObject = this._scene.add.image(
            0, 0,
            this._unitDetails.assetKey,
            this._unitDetails.assetFrame || 0
        ).setOrigin(0).setScale(2);
        this._phaserGameObject.setPosition(position.x * this._phaserGameObject.displayWidth, position.y * this._phaserGameObject.displayHeight);
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
}
