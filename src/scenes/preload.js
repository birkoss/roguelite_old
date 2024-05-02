import Phaser from "../lib/phaser.js";

import { SCENE_KEYS } from "../keys/scene.js";
import { MAIN_UI_ASSET_KEYS, MAP_ASSET_KEYS, PANEL_UI_ASSET_KEYS } from "../keys/asset.js";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.PRELOAD_SCENE,
        });
    }

    preload() {
        this.load.image(MAIN_UI_ASSET_KEYS.SELECTED_UNIT, 'assets/images/ui/selected-unit.png');
        this.load.image(MAIN_UI_ASSET_KEYS.ATTACK_MELEE, 'assets/images/ui/attack_melee.png');
        this.load.image(MAIN_UI_ASSET_KEYS.MOVE, 'assets/images/ui/move.png');

        this.load.image(PANEL_UI_ASSET_KEYS.HEALTHBAR_LEFT, 'assets/images/ui/healthbar-left.png');
        this.load.image(PANEL_UI_ASSET_KEYS.HEALTHBAR_MIDDLE, 'assets/images/ui/healthbar-middle.png');
        this.load.image(PANEL_UI_ASSET_KEYS.HEALTHBAR_RIGHT, 'assets/images/ui/healthbar-right.png');

        this.load.image(PANEL_UI_ASSET_KEYS.SHADOW_LEFT, 'assets/images/ui/shadow-left.png');
        this.load.image(PANEL_UI_ASSET_KEYS.SHADOW_MIDDLE, 'assets/images/ui/shadow-middle.png');
        this.load.image(PANEL_UI_ASSET_KEYS.SHADOW_RIGHT, 'assets/images/ui/shadow-right.png');

        this.load.spritesheet(MAP_ASSET_KEYS.WORLD, 'assets/tilesets/world.png', {
            frameWidth: 48,
            frameHeight: 48,
        });
        this.load.spritesheet(MAP_ASSET_KEYS.UNITS, 'assets/tilesets/units.png', {
            frameWidth: 24,
            frameHeight: 24,
        });
        this.load.spritesheet(MAP_ASSET_KEYS.EFFECTS_LARGE, 'assets/tilesets/effects-large.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet(MAP_ASSET_KEYS.EFFECTS_SMALL, 'assets/tilesets/effects-small.png', {
            frameWidth: 48,
            frameHeight: 48,
        });
    }

    create() {
        this.scene.start(SCENE_KEYS.MAIN_SCENE);
    }
}
