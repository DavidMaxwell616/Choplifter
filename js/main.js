import GameScene from './scenes/GameScene.js';

const INTERNAL_W = 320;
const INTERNAL_H = 180;

new Phaser.Game({
    type: Phaser.WEBGL,
    width: INTERNAL_W,
    height: INTERNAL_H,
    backgroundColor: "#0b0f14",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: INTERNAL_W,
        height: INTERNAL_H,
        zoom: 3
    },
    scene: [GameScene]
});

