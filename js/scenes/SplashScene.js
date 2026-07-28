const INTERNAL_W = 320;
const INTERNAL_H = 180;
const ASSET = "assets/images/";

export default class SplashScene extends Phaser.Scene {
    constructor() {
        super("SplashScene");
    }

    preload() {
        this.load.image("splash", `${ASSET}splash.png`);
    }

    create() {
        this.cameras.main.setBackgroundColor("#000000");

        const splash = this.add.image(
            INTERNAL_W / 2,
            INTERNAL_H / 2,
            "splash"
        );
        const scale = Math.min(
            INTERNAL_W / splash.width,
            INTERNAL_H / splash.height
        );
        splash.setScale(scale);

        this.startText = this.add.text(
            INTERNAL_W / 2,
            INTERNAL_H - 10,
            "PRESS SPACE OR ENTER",
            {
                fontFamily: "monospace",
                fontSize: "10px",
                color: "#ffffff",
                backgroundColor: "#000000",
                stroke: "#000000",
                strokeThickness: 1,
                padding: { x: 4, y: 1 }
            }
        )
            .setOrigin(0.5, 1)
            .setResolution(3);

        this.tweens.add({
            targets: this.startText,
            alpha: 0.25,
            duration: 550,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1
        });

        this.started = false;
        this.input.keyboard.once("keydown-SPACE", () => this.startGame());
        this.input.keyboard.once("keydown-ENTER", () => this.startGame());
        this.input.once("pointerdown", () => this.startGame());
    }

    startGame() {
        if (this.started) return;
        this.started = true;

        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("GameScene");
        });
        this.cameras.main.fadeOut(300, 0, 0, 0);
    }
}
