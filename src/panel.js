import Phaser from "./lib/phaser.js";

export class Panel {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.GameObjects.Container} */
    #container;
    /** @type {Phaser.GameObjects.Text} */
    #textName;

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

    #createPanel() {
        this.#textName = this.#scene.add.text(0, 0, 'XXXXXXXXX');

        this.#container = this.#scene.add.container(0, 0, [this.#textName]);
    }
}