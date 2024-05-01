import Phaser from '../lib/phaser.js';

export class Unit {
    /** @protected @type {Phaser.Scene} */
    _scene;

    /** @protected @type {Phaser.GameObjects.Image} */
    _phaserGameObject;

    /** @protected @type {import('../types/typedef.js').UnitDetails} */
    _unitDetails;

    /** @protected @type {number} */
    _currentHealth;
    /** @protected @type {number} */
    _maxHealth;

    /**
     * @param {import('../types/typedef.js').UnitConfig} config 
     * @param {import('../types/typedef.js').Coordinate} position 
     */
    constructor(config, position) {
        this._scene = config.scene;
        this._unitDetails = config.unitDetails;

        this._currentHealth = this._unitDetails.currentHp;
        this._maxHealth = this._unitDetails.maxHp;

        this._monsterAttacks = [];

        this._phaserGameObject = this._scene.add.image(
            0, 0,
            this._unitDetails.assetKey,
            this._unitDetails.assetFrame || 0
        ).setOrigin(0).setScale(2);

        this._phaserGameObject.setPosition(position.x * this._phaserGameObject.displayWidth, position.y * this._phaserGameObject.displayHeight);
    }

    /** @type {Phaser.GameObjects.Image} */
    get gameObject() {
        return this._phaserGameObject;
    }

    /** @type {boolean} */
    get isAlive() {
        return this._currentHealth > 0;
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
        this._currentHealth -= damage;
        if (this._currentHealth < 0) {
            this._currentHealth = 0;
        }
    }
}
