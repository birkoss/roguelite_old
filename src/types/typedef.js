import Phaser from '../lib/phaser.js';
import { UNIT_ACTION_TYPES } from '../units/unit.js';

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
 * @property {UnitAction[]} actions
 */

/** 
 * @typedef UnitAction
 * @type {Object}
 * @property {UNIT_ACTION_TYPES} type
 * @property {Coordinate} position
 */

/** 
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */
