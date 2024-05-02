import Phaser from "./lib/phaser.js";

import { HealthBar } from "./healthbar.js";

export class Panel {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.GameObjects.Container} */
    #container;
    /** @type {Phaser.GameObjects.Text} */
    #textName;
    /** @type {HealthBar} */
    #healthBar;
    /** @type {HealthBar} */
    #actionPoints;

    constructor(scene) {
        this.#scene = scene;

        this.#createPanel();
    }

    /** @type {Phaser.GameObjects.Container} */
    get container() {
        return this.#container;
    }

    /**
     * @param {string} name 
     */
    updateName(name) {
        this.#textName.setText(name);
    }

    /**
     * @param {number} current 
     * @param {number} max 
     */
    updateHealthBar(current, max) {
        this.#healthBar.setText(`${current}/${max}`);
        this.#healthBar.setWidthAnimated(current / max);
    }

    /**
     * @param {number} current 
     * @param {number} max 
     */
    updateActionPoints(current, max) {
        this.#actionPoints.setText(`${current}/${max}`);
        this.#actionPoints.setWidthAnimated(current / max, {
            duration: 100,
        });
    }

    #createPanel() {
        this.#textName = this.#scene.add.text(0, 0, 'XXXXXXXXX');

        this.#healthBar = new HealthBar(this.#scene, 0, 40, 200);

        this.#actionPoints = new HealthBar(this.#scene, 0, 80, 200);

        this.#container = this.#scene.add.container(0, 0, [this.#textName, this.#healthBar.container, this.#actionPoints.container]);
    }
}