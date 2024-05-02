import { HealthBar } from "./healthbar.js";
import Phaser from "./lib/phaser.js";

export class Panel {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.GameObjects.Container} */
    #container;
    /** @type {Phaser.GameObjects.Text} */
    #textName;
    /** @type {HealthBar} */
    #healthBar;

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
        console.log(current, max);
        this.#healthBar.setText(`${current}/${max}`);
        this.#healthBar.setWidthAnimated(current / max);
    }

    #createPanel() {
        this.#textName = this.#scene.add.text(0, 0, 'XXXXXXXXX');

        this.#healthBar = new HealthBar(this.#scene, 0, 100, 200);

        this.#container = this.#scene.add.container(0, 0, [this.#textName, this.#healthBar.container]);
    }
}