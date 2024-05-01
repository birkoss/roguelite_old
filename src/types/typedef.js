import Phaser from '../lib/phaser.js';

/** 
 * @typedef UnitConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
 * @property {UnitDetails} unitDetails
 */

/** 
 * @typedef UnitDetails
 * @type {Object}
 * @property {string} name
 * @property {string} assetKey
 * @property {number} [assetFrame=0]
 * @property {number} currentLevel
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} maxAp
 * @property {number} currentAp
 * @property {number} baseAttack
 * @property {number[]} attackIds
 */

/** 
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */
