export class Pathfinding {
    /** @type {number[]} */
    #grid;
    /** @type {number} */
    #width;
    /** @type {number} */
    #height;

    /** @type {boolean} */
    #includeStartPosition;
    /** @type {number} */
    #emptyValue;

    constructor(grid, width, height) {
        this.#grid = grid;
        this.#width = width;
        this.#height = height;

        this.#emptyValue = 0;
        this.#includeStartPosition = false;
    }

    /**
     * @param {import("./types/typedef").Coordinate} startPosition 
     * @param {import("./types/typedef").Coordinate} endPosition 
     * @return {import("./types/typedef").Coordinate[]}
     */
    find(startPosition, endPosition) {
        if (startPosition.x == endPosition.x && startPosition.y == endPosition.y) {
            return [];
        }
        return this.#findPath(startPosition, endPosition);
    }

    /**
     * @param {import("./types/typedef").Coordinate} startPosition 
     * @param {import("./types/typedef").Coordinate} endPosition 
     * @return {import("./types/typedef").Coordinate[]}
     */
    #findPath(startPosition, endPosition) {
        let queue = [];
        queue.push(startPosition);

        let completePaths = {};
        completePaths[`${startPosition.x}x${startPosition.y}`] = startPosition;

        while (queue.length > 0) {
            let current = queue.shift();

            let neighboors = this.#findNeighboors(current);
            neighboors.forEach((singleNeighboor) => {
                if (completePaths[`${singleNeighboor.x}x${singleNeighboor.y}`] === undefined) {
                    let gridIndex = (singleNeighboor.y * this.#width) + singleNeighboor.x;
                    if (this.#grid[gridIndex] === this.#emptyValue) {
                        queue.push(singleNeighboor);
                        completePaths[`${singleNeighboor.x}x${singleNeighboor.y}`] = current;
                    }
                }
            });
        }

        let paths = [];

        if (completePaths[`${endPosition.x}x${endPosition.y}`] === undefined) {
            let current = endPosition;
            paths.push(current);

            while (current != startPosition) {
                current = completePaths[`${current.x}x${current.y}`]
                if (current !== startPosition || this.#includeStartPosition) {
                    paths.push(current);
                }
            }
        }

        paths.reverse();
        return paths;
    }

    /**
     * @param {import("./types/typedef").Coordinate} position 
     * @returns {import("./types/typedef").Coordinate[]}
     */
    #findNeighboors(position) {
        let neighboors = [];
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                if (Math.abs(x) !== Math.abs(y)) {
                    let currentNeighboor = {
                        x: position.x + x,
                        y: position.y + y,
                    };
                    if (currentNeighboor.x >= 0 && currentNeighboor.x < this.#width && currentNeighboor.y >= 0 && currentNeighboor.y < this.#height) {
                        neighboors.push(currentNeighboor);
                    }
                }
            }
        }
        return neighboors;
    };
}
