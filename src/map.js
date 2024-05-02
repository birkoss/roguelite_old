import { MAP_ASSET_KEYS } from './keys/asset.js';
import Phaser from './lib/phaser.js';


/** @typedef {keyof typeof TILE_TYPE} TileType */

/** @enum {TileType} */
export const TILE_TYPE = Object.freeze({
    BORDER: 'BORDER',
    FLOOR: 'FLOOR',
});

/** 
 * @typedef Tile
 * @type {Object}
 * @property {number} x
 * @property {number} y
 * @property {TileType} type
 * @property {boolean} isWalkable
 */


export class Map {
    /** @type {number} */
    #width;
    /** @type {number} */
    #height;

    /** @type {Tile[]} */
    #tiles;

    /**
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width, height) {
        this.#width = width;
        this.#height = height;

        this.#tiles = [];

        this.#generateMap();
    }

    /** @type {Tile[]} */
    get tiles() {
        return [...this.#tiles];
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isInBound(x, y) {
        if (x < 0 || y < 0 || x >= this.#width || y >= this.#height) {
            return false;
        }
        return true;
    }

    canMoveTo(x, y) {
        return this.tiles.filter(singleTile => singleTile.x === x && singleTile.y === y && singleTile.type === TILE_TYPE.FLOOR).length == 1;
    }

    /**
     * 
     * @param {import('./types/typedef.js').Coordinate} position1 
     * @param {import('./types/typedef.js').Coordinate} position2 
     * @returns {number}
     */
    getDistanceBetween(position1, position2) {
        return Math.abs(position1.x - position2.x) + Math.abs(position1.y - position2.y);
    }

    #generateMap() {
        this.#tiles = [];

        for (var y=0; y<this.#height; y++) {
            for (var x=0; x<this.#width; x++) {
                const isBorder = (x == 0 || y == 0 || y == this.#height-1 || x == this.#width-1);
                this.#tiles.push({
                    x: x,
                    y: y,
                    type: (isBorder ? TILE_TYPE.BORDER : TILE_TYPE.FLOOR),
                    isWalkable: !isBorder,
                });
            }
        }
    }
}
