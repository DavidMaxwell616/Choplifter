const WORLD_W = 2636;
const WORLD_H = 180;
const GROUND_Y = 148;
const BASE_X = WORLD_W - 110;
const BASE_Y = GROUND_Y + 7;
const ART_SCALE = 0.5;
const CHOPPER_SCALE = 0.5;
const CHOPPER_TILT_INCREMENT = 2;
const CHOPPER_TURN_DURATION = 0.18;
const CHOPPER_CRASH_ACCELERATION = 190;
const CHOPPER_CRASH_SPIN_SPEED = 90;
const BULLET_SCALE = .5;
const MISSILE_SCALE = 0.5;
const CHOPPER_GROUND_Y = 144;
const BORDER_X = BASE_X - 600;
const MOUNTAIN_SCROLL_FACTOR = 0.35;
const HOUSE_SCALE = 0.18;
const TANK_DISPLAY_WIDTH = 66 * ART_SCALE;
const TANK_GROUND_Y = GROUND_Y + 20;
const TANK_MIN_X = 80;
const TANK_MIN_GAP = TANK_DISPLAY_WIDTH + 8;
const TANK_WANDER_DISTANCE = 120;
const TANK_FIRE_RANGE = 480;
const TANK_FIRE_MIN_INTERVAL = 1.8;
const TANK_FIRE_MAX_INTERVAL = 3.2;
const TANK_BULLET_SPEED = 120;
const TANK_BULLET_ARC_HEIGHT = 50;
const TANK_BULLET_LANDING_Y = GROUND_Y + 5;
const JET_TRIGGER_DISTANCE = 130;
const JET_PASS_DURATION = 2.8;
const JET_VERTICAL_TRACK_SPEED = 120;
const JET_FIRE_VERTICAL_TOLERANCE = 2;
const JET_MIN_COOLDOWN = 4;
const JET_MAX_COOLDOWN = 7;
const JET_MISSILE_SPEED = 145;
const JET_MISSILE_GRAVITY = 6;
const JET_MISSILE_LAUNCH_GAP = 0.18;
const UFO_TRIGGER_RESCUES = 30;
const UFO_DESCENT_SPEED = 34;
const UFO_FOLLOW_SPEED = 58;
const UFO_BULLET_SPEED = 105;
const UFO_FIRE_MIN_INTERVAL = 1.2;
const UFO_FIRE_MAX_INTERVAL = 2.3;
const PEOPLE_PER_HOUSE = 20;
const PEOPLE_SCALE = .35;
const HOSTAGE_WAVE_SIZE = 5;
const ASSET = "assets/images/";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.image("ground", `${ASSET}background.png`);
        this.load.image("hudFrame", `${ASSET}hud.png`);
        this.load.image("mountain", `${ASSET}mountain.png`);
        this.load.image("moon", `${ASSET}moon.png`);
        this.load.image("missile", `${ASSET}missile.png`);
        this.load.image("bullet", `${ASSET}bullet.png`);
        this.load.spritesheet("jet", `${ASSET}jet.png`, {
            frameWidth: 70,
            frameHeight: 46
        });
        this.load.spritesheet("ufo", `${ASSET}ufo.png`, {
            frameWidth: 26,
            frameHeight: 22
        });

        this.load.spritesheet("hq", `${ASSET}hq.png`, {
            frameWidth: 435,
            frameHeight: 86
        });
        this.load.spritesheet("bombBurst", `${ASSET}bomb burst.png`, {
            frameWidth: 55,
            frameHeight: 30
        });
        this.load.spritesheet("explosion", `${ASSET}explosion.png`, {
            frameWidth: 76,
            frameHeight: 38
        });
        this.load.spritesheet("house", `${ASSET}house.png`, {
            frameWidth: 278,
            frameHeight: 135
        });
        this.load.spritesheet("borderMarker", `${ASSET}border marker.png`, {
            frameWidth: 21,
            frameHeight: 27
        });
        this.load.spritesheet("chopper", `${ASSET}chopper.png`, {
            frameWidth: 80,
            frameHeight: 26
        });
        this.load.spritesheet("tank", `${ASSET}tank.png`, {
            frameWidth: 66,
            frameHeight: 29
        });
        this.load.spritesheet("people", `${ASSET}people.png`, {
            frameWidth: 20,
            frameHeight: 24
        });
    }

    create() {
        this.physics.world.setBounds(0, 28, WORLD_W, WORLD_H - 28);
        this.physics.world.isPaused = false;
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBackgroundColor("#000000");

        this.createAnimations();
        this.createSky();
        this.createTerrain();
        this.createStructures();
        this.createHostages();
        this.createPlayer();
        this.paused = false;
        this.facing = "left";
        this.chopperCrashing = false;
        this.chopperDestroyed = false;
        this.chopperCrashes = 0;
        this.respawnInvulnerability = 0;
        this.gameOver = false;
        this.turnTarget = null;
        this.turnTimer = 0;
        this.turnInputLocked = false;
        this.fuel = 66;
        this.onboard = 0;
        this.rescued = 0;
        this.dead = 0;
        this.capacity = 16;
        this.lastDirection = -1;
        this.bullets = [];
        this.tankBullets = [];
        this.unloadingPeople = [];
        this.unloadCooldown = 0;
        this.jet = null;
        this.jetMissiles = [];
        this.jetCooldown = 0;
        this.jetNearHouses = false;
        this.ufo = null;
        this.ufoBullets = [];
        this.ufoSpawned = false;
        this.createHud();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,P,R");
        this.pauseKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC
        );
        this.shiftKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SHIFT
        );
        this.controlKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.CTRL
        );
        this.input.keyboard.on("keydown-S", event => {
            if (!event.ctrlKey) return;

            event.preventDefault();
            this.sound.mute = !this.sound.mute;
            this.updateControlText();
        });
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setDeadzone(70, 32);
    }

    createAnimations() {
        if (!this.anims.exists("hqFlag")) {
            this.anims.create({
                key: "hqFlag",
                frames: this.anims.generateFrameNumbers("hq", { start: 0, end: 1 }),
                frameRate: 3,
                repeat: -1
            });
        }

        if (!this.anims.exists("houseSpill")) {
            this.anims.create({
                key: "houseSpill",
                frames: this.anims.generateFrameNumbers("house", { start: 1, end: 2 }),
                frameRate: 4,
                repeat: -1
            });
        }

        if (!this.anims.exists("ufoHover")) {
            this.anims.create({
                key: "ufoHover",
                frames: this.anims.generateFrameNumbers("ufo", {
                    start: 0,
                    end: 1
                }),
                frameRate: 5,
                repeat: -1
            });
        }

        if (!this.anims.exists("bombBurst")) {
            this.anims.create({
                key: "bombBurst",
                frames: this.anims.generateFrameNumbers("bombBurst", {
                    start: 0,
                    end: 3
                }),
                frameRate: 16,
                repeat: 0
            });
        }

        if (!this.anims.exists("explosion")) {
            this.anims.create({
                key: "explosion",
                frames: this.anims.generateFrameNumbers("explosion", {
                    start: 0,
                    end: 7
                }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!this.anims.exists("chopperSideways")) {
            this.anims.create({
                key: "chopperSideways",
                frames: [0, 1, 2, 3].map(frame => ({ key: "chopper", frame })),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists("chopperForward")) {
            this.anims.create({
                key: "chopperForward",
                frames: [4, 5, 6, 7].map(frame => ({ key: "chopper", frame })),
                frameRate: 12,
                repeat: -1
            });
        }
        if (!this.anims.exists("peopleHelp")) {
            this.anims.create({
                key: "peopleHelp",
                frames: this.anims.generateFrameNumbers("people", { start: 0, end: 1 }),
                frameRate: 3,
                repeat: -1
            });
        }

        if (!this.anims.exists("peopleRun")) {
            this.anims.create({
                key: "peopleRun",
                frames: this.anims.generateFrameNumbers("people", { start: 6, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    createSky() {
        const starLayers = Array.from({ length: 6 }, () =>
            this.add.graphics().setScrollFactor(0).setDepth(0)
        );
        const colors = [0xffffff, 0xffffff, 0x00c8ff, 0xff6a00];
        let seed = 0x2f6e2b1;
        const random = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 0x100000000;
        };

        for (let i = 0; i < 150; i += 1) {
            const layer = starLayers[i % starLayers.length];
            const x = Math.floor(random() * 320);
            const y = 31 + Math.floor(random() * (GROUND_Y - 42));
            layer.fillStyle(colors[Math.floor(random() * colors.length)], 1);
            layer.fillRect(x, y, random() > 0.88 ? 2 : 1, 1);
        }

        starLayers.forEach((layer, index) => {
            this.tweens.add({
                targets: layer,
                alpha: 0.2 + index * 0.08,
                duration: 420 + index * 170,
                delay: index * 95,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1
            });
        });

        this.moon = this.add.image(265, 56, "moon")
            .setOrigin(0.5)
            .setScale(ART_SCALE)
            .setScrollFactor(0)
            .setDepth(0);
    }

    createTerrain() {
        [370, 730, 1160, 1510, 1900, 2240].forEach((x, index) => {
            this.add.image(x, GROUND_Y, "mountain")
                .setOrigin(0.5, 1)
                .setScale(ART_SCALE)
                .setScrollFactor(MOUNTAIN_SCROLL_FACTOR, 1);
        });

        this.ground = this.add.tileSprite(
            0,
            GROUND_Y,
            WORLD_W,
            WORLD_H - GROUND_Y,
            "ground"
        ).setOrigin(0, 0).setDepth(1);
    }

    createStructures() {
        this.base = this.add.sprite(BASE_X, BASE_Y, "hq")
            .setOrigin(0.5, 1)
            .setScale(ART_SCALE)
            .setDepth(3)
            .play("hqFlag");

        this.housePositions = [440, 900, 1360];
        this.houses = this.housePositions.map(x => {
            const house = this.add.sprite(x, BASE_Y + 4, "house", 0)
                .setOrigin(0.5, 1)
                .setScale(HOUSE_SCALE)
                .setDepth(3);
            house.breached = false;
            house.hostages = [];
            return house;
        });

        this.createBorderMarkers();

        this.tanks = [620, 1100, 1580, 2080].map((x, index) => this.createTank(x, index));
    }

    createBorderMarkers() {
        const markerCount = 7;
        this.borderMarkers = Array.from({ length: markerCount }, (_, index) => {
            const depthRatio = index / (markerCount - 1);
            const marker = this.add.sprite(0, 0, "borderMarker", index % 2)
                .setOrigin(0.5, 1)
                .setScrollFactor(0)
                .setDepth(4 - depthRatio);

            marker.depthRatio = depthRatio;
            return marker;
        });

        this.updateBorderMarkers();
    }

    updateBorderMarkers() {
        if (!this.borderMarkers) return;

        const cameraScrollX = this.cameras.main.scrollX;
        const foregroundX = BORDER_X - cameraScrollX;
        const screenCenterX = this.cameras.main.width / 2;
        const horizonX = screenCenterX +
            (foregroundX - screenCenterX) * MOUNTAIN_SCROLL_FACTOR;
        const horizonY = GROUND_Y + 4;

        this.borderMarkers.forEach(marker => {
            const depth = marker.depthRatio;
            const perspectiveDepth = 1 - Math.pow(1 - depth, 2);

            marker.x = Phaser.Math.Linear(foregroundX, horizonX, perspectiveDepth);
            marker.y = Phaser.Math.Linear(WORLD_H, horizonY, perspectiveDepth);
            marker.setScale(Phaser.Math.Linear(ART_SCALE, 0.08, perspectiveDepth));
        });
    }

    createTank(x, index) {
        const maxTankX = BORDER_X - TANK_DISPLAY_WIDTH / 2;
        const tank = this.add.sprite(
            Math.min(x, maxTankX),
            TANK_GROUND_Y,
            "tank",
            2
        )
            .setOrigin(0.5, 1)
            .setScale(ART_SCALE)
            .setDepth(5);
        tank.direction = index % 2 ? -1 : 1;
        tank.moveSpeed = Phaser.Math.FloatBetween(20, 34);
        tank.wanderOffset = Phaser.Math.FloatBetween(
            -TANK_WANDER_DISTANCE,
            TANK_WANDER_DISTANCE
        );
        tank.retargetTimer = Phaser.Math.FloatBetween(0.8, 2.4);
        tank.fireCooldown = Phaser.Math.FloatBetween(0.6, 1.5);
        return tank;
    }

    createHostages() {
        this.hostages = [];
        this.houses.forEach((house, houseIndex) => {
            for (let i = 0; i < PEOPLE_PER_HOUSE; i += 1) {
                const person = this.createPerson(house.x, GROUND_Y + 4);
                person.homeX = house.x;
                person.house = house;
                person.phase = houseIndex * 0.7 + i;
                person.releaseOrder = i;
                person.releaseDelay = 0;
                person.rescueState = "contained";
                person.setVisible(false);
                house.hostages.push(person);
                this.hostages.push(person);
            }
        });
    }

    createPerson(x, y) {
        const person = this.add.sprite(x, y, "people", 0)
            .setOrigin(0.5, 1)
            .setScale(PEOPLE_SCALE)
            .setDepth(6);
        person.active = true;
        person.animationStartFrames = {
            peopleHelp: Phaser.Math.Between(0, 1),
            peopleRun: Phaser.Math.Between(0, 5)
        };
        person.animationSpeeds = {
            peopleHelp: Phaser.Math.FloatBetween(0.65, 1.25),
            peopleRun: Phaser.Math.FloatBetween(0.85, 1.2)
        };
        person.wavePause = Phaser.Math.Between(80, 550);
        person.spillOffset = Phaser.Math.FloatBetween(-4, 4);
        person.spillSpeed = Phaser.Math.FloatBetween(19, 29);
        person.approachSpeed = Phaser.Math.FloatBetween(28, 42);
        person.unloadSpeed = Phaser.Math.FloatBetween(29, 40);
        return person;
    }

    playPersonAnimation(person, key, ignoreIfPlaying = false) {
        person.anims.timeScale = person.animationSpeeds[key];
        person.play({
            key,
            startFrame: person.animationStartFrames[key],
            repeatDelay: key === "peopleHelp" ? person.wavePause : 0
        }, ignoreIfPlaying);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(
            BASE_X - 25,
            CHOPPER_GROUND_Y,
            "chopper",
            6
        )
            .setScale(CHOPPER_SCALE)
            .setDepth(8)
            .setCollideWorldBounds(true)
            .play("chopperSideways");
        this.player.setMaxVelocity(105, 82);
        this.player.setDrag(180, 150);
        this.player.tiltAngle = 0;
    }

    createHud() {
        this.hudFrame = this.add.image(160, 0, "hudFrame")
            .setOrigin(0.5, 0)
            .setScale(ART_SCALE)
            .setScrollFactor(0)
            .setDepth(100);

        const textStyle = {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 1
        };

        this.house1Text = this.add.text(90, 9, "20", textStyle)
            .setOrigin(0.5, 0)
            .setResolution(3)
            .setScrollFactor(0)
            .setDepth(101);
        this.house2Text = this.add.text(166, 9, "20", textStyle)
            .setOrigin(0.5, 0)
            .setResolution(3)
            .setScrollFactor(0)
            .setDepth(101);
        this.house3Text = this.add.text(245, 9, "20", textStyle)
            .setOrigin(0.5, 0)
            .setResolution(3)
            .setScrollFactor(0)
            .setDepth(101);
        const labelStyle = {
            fontFamily: "monospace",
            fontSize: "8px",
            color: "#ffffff",
            padding: { x: 2, y: 0 }
        };
        [
            { x: 83, label: "ALIVE" },
            { x: 160, label: "RESCUED" },
            { x: 243, label: "DEAD" }
        ].forEach(({ x, label }) => {
            this.add.text(x, -1, label, labelStyle)
                .setOrigin(0.5, 0)
                .setScrollFactor(0)
                .setDepth(101);
        });
        this.updateHudCounters();

        this.helpText = this.add.text(
            160,
            WORLD_H,
            "",
            {
                fontFamily: "monospace",
                fontSize: "7px",
                color: "#ffffff",
                backgroundColor: "#000000"
            }
        )
            .setOrigin(0.5, 1)
            .setResolution(2)
            .setScrollFactor(0)
            .setDepth(101)
            .setAlpha(0.9);
        this.updateControlText();

        this.pauseText = this.add.text(160, 90, "PAUSED", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
            backgroundColor: "#000000"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setVisible(false);

        this.gameOverText = this.add.text(160, 90, "GAME OVER", {
            fontFamily: "monospace",
            fontSize: "22px",
            color: "#ffffff",
            backgroundColor: "#000000",
            stroke: "#ff3b20",
            strokeThickness: 2,
            padding: { x: 8, y: 4 }
        })
            .setOrigin(0.5)
            .setResolution(3)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        this.gameOverStatsText = this.add.text(160, 112, "", {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 6, y: 3 },
            align: "center"
        })
            .setOrigin(0.5, 0)
            .setResolution(3)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);
    }

    update(_, deltaMs) {
        if (this.gameOver) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.scene.restart();
            return;
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.pauseKey) ||
            Phaser.Input.Keyboard.JustDown(this.keys.P)
        ) {
            this.paused = !this.paused;
            this.physics.world.isPaused = this.paused;
            this.anims.globalTimeScale = this.paused ? 0 : 1;
            this.pauseText.setVisible(this.paused);
        }
        this.updateBorderMarkers();
        if (this.paused) return;

        const dt = Math.min(deltaMs / 1000, 0.05);
        this.respawnInvulnerability = Math.max(
            0,
            this.respawnInvulnerability - dt
        );
        this.updateChopperDirection(dt);
        this.updatePlayer(dt);
        this.updateHostages(dt);
        this.updateBaseUnloading(dt);
        this.updateTanks(dt);
        this.updateTankBullets(dt);
        this.updateJet(dt);
        this.updateJetMissiles(dt);
        this.updateUfo(dt);
        this.updateUfoBullets(dt);
        this.updateBullets(dt);

        if (
            !this.chopperCrashing &&
            !this.chopperDestroyed &&
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
        ) {
            this.fire();
        }

        this.fuel = Math.max(0, this.fuel - dt * 0.32);
        this.updateHudCounters();
        if (
            this.allHostagesAccountedFor() &&
            !this.chopperCrashing &&
            !this.chopperDestroyed
        ) {
            this.startGameOver();
        }
    }

    updateHudCounters() {
        this.house1Text.setText(String(this.onboard).padStart(2, "0"));
        this.house2Text.setText(String(this.rescued).padStart(2, "0"));
        this.house3Text.setText(String(this.dead).padStart(2, "0"));
    }

    updateControlText() {
        const soundState = this.sound.mute ? "OFF" : "ON";
        this.helpText.setText(
            "ARROWS MOVE  SHIFT+LEFT/RIGHT TURN  SPACE FIRE   " +
            `ESC PAUSE  CTRL+S SOUND ${soundState}`
        );
    }

    updateChopperDirection(dt) {
        if (this.chopperCrashing || this.chopperDestroyed) return;

        const turnLeft = this.shiftKey.isDown && this.cursors.left.isDown;
        const turnRight = this.shiftKey.isDown && this.cursors.right.isDown;
        const hasTurnInput = turnLeft || turnRight;

        if (!hasTurnInput) {
            this.turnInputLocked = false;
            if (this.facing === "forward" && this.turnTarget) {
                this.turnTarget = null;
                this.turnTimer = 0;
            }
        } else if (!this.turnInputLocked) {
            const target = turnRight ? "right" : "left";
            this.turnInputLocked = true;

            if (this.facing !== target || this.turnTarget) {
                this.turnTarget = target;
                this.turnTimer = CHOPPER_TURN_DURATION;
                this.setChopperFacing("forward");
            }
        }

        if (!this.turnTarget) return;

        this.turnTimer -= dt;
        if (this.turnTimer <= 0) {
            const target = this.turnTarget;
            this.turnTarget = null;
            this.setChopperFacing(target);
        }
    }

    setChopperFacing(facing) {
        this.facing = facing;

        if (facing === "forward") {
            this.player.setFlipX(false).play("chopperForward");
        } else {
            this.lastDirection = facing === "right" ? 1 : -1;
            this.player
                .setFlipX(facing === "right")
                .play("chopperSideways");
        }
    }

    updatePlayer(dt) {
        if (this.chopperDestroyed) return;
        if (this.chopperCrashing) {
            this.updateChopperCrash(dt);
            return;
        }

        if (this.player.y >= CHOPPER_GROUND_Y) {
            this.player.setY(CHOPPER_GROUND_Y);
            this.player.setVelocityY(Math.min(0, this.player.body.velocity.y));
        }

        const landed = this.isChopperGrounded();
        const shiftTurning =
            this.shiftKey.isDown &&
            (this.cursors.left.isDown || this.cursors.right.isDown);
        const left =
            this.keys.A.isDown ||
            (!landed && this.cursors.left.isDown && !shiftTurning);
        const right =
            this.keys.D.isDown ||
            (!landed && this.cursors.right.isDown && !shiftTurning);
        const up = this.keys.W.isDown || this.cursors.up.isDown;
        const down =
            (this.keys.S.isDown && !this.controlKey.isDown) ||
            (!landed && this.cursors.down.isDown);

        if (this.fuel > 0) {
            this.player.setAcceleration(
                (right ? 190 : 0) - (left ? 190 : 0),
                (down ? 160 : 0) - (up ? 160 : 0)
            );
        } else {
            this.player.setAcceleration(0, 70);
        }

        const targetTilt = Phaser.Math.Clamp(
            this.player.body.velocity.x / this.player.body.maxVelocity.x,
            -1,
            1
        ) * 10;
        this.player.tiltAngle = Phaser.Math.Linear(
            this.player.tiltAngle,
            targetTilt,
            Math.min(1, dt * 8)
        );
        this.player.setAngle(
            Math.round(this.player.tiltAngle / CHOPPER_TILT_INCREMENT) *
            CHOPPER_TILT_INCREMENT
        );

        if (Math.abs(this.player.x - BASE_X) < 75 && landed) {
            this.fuel = Math.min(66, this.fuel + dt * 14);
        }
    }

    updateChopperCrash(dt) {
        this.player.setAcceleration(0, CHOPPER_CRASH_ACCELERATION);
        this.player.setDragX(60);
        this.player.angle +=
            this.lastDirection * CHOPPER_CRASH_SPIN_SPEED * dt;

        const chopperBottom =
            this.player.y + this.player.displayHeight * 0.5;
        const hitHouse = this.houses.find(house =>
            Math.abs(this.player.x - house.x) < house.displayWidth * 0.5 &&
            chopperBottom >= house.y - house.displayHeight
        );
        const hitGround = this.player.y >= CHOPPER_GROUND_Y;

        if (hitHouse || hitGround) {
            const impactY = hitHouse
                ? Math.min(this.player.y, hitHouse.y)
                : GROUND_Y;
            this.finishChopperCrash(impactY);
        }
    }

    finishChopperCrash(impactY) {
        this.chopperCrashing = false;
        this.chopperDestroyed = true;
        this.chopperCrashes += 1;
        this.dead += this.onboard;
        this.onboard = 0;
        this.updateHudCounters();
        this.player.setAcceleration(0, 0);
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.setVisible(false);
        this.createExplosion(this.player.x, impactY, 1, 1, () => {
            if (
                this.chopperCrashes >= 3 ||
                this.allHostagesAccountedFor()
            ) {
                this.startGameOver();
            } else {
                this.respawnChopper();
            }
        });
    }

    respawnChopper() {
        this.clearEnemyProjectiles();
        this.chopperDestroyed = false;
        this.chopperCrashing = false;
        this.respawnInvulnerability = 1.5;
        this.facing = "left";
        this.lastDirection = -1;
        this.turnTarget = null;
        this.turnTimer = 0;
        this.turnInputLocked = false;
        this.player.body.enable = true;
        this.player
            .setPosition(BASE_X - 25, CHOPPER_GROUND_Y)
            .setVisible(true)
            .setAlpha(1)
            .setAngle(0)
            .setFlipX(false)
            .setAcceleration(0, 0)
            .setVelocity(0, 0)
            .setDrag(180, 150)
            .play("chopperSideways");
        this.player.tiltAngle = 0;
        this.fuel = 66;
    }

    clearEnemyProjectiles() {
        this.tankBullets.forEach(bullet => bullet.destroy());
        this.jetMissiles.forEach(missile => missile.destroy());
        this.ufoBullets.forEach(bullet => bullet.destroy());
        this.tankBullets.length = 0;
        this.jetMissiles.length = 0;
        this.ufoBullets.length = 0;
    }

    allHostagesAccountedFor() {
        return this.rescued + this.dead >= this.hostages.length;
    }

    startGameOver() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.clearEnemyProjectiles();
        this.physics.world.isPaused = true;
        this.pauseText.setVisible(false);
        this.gameOverText.setVisible(true);
        this.gameOverStatsText
            .setText(
                `RESCUED: ${String(this.rescued).padStart(2, "0")}\n` +
                `DEAD:    ${String(this.dead).padStart(2, "0")}`
            )
            .setVisible(true);
        this.time.delayedCall(10000, () => {
            this.physics.world.isPaused = false;
            this.scene.start("SplashScene");
        });
    }

    isChopperGrounded(maxHorizontalSpeed = Infinity) {
        return (
            this.player.y >= CHOPPER_GROUND_Y - 0.5 &&
            Math.abs(this.player.body.velocity.y) < 30 &&
            Math.abs(this.player.body.velocity.x) < maxHorizontalSpeed
        );
    }

    updateHostages(dt) {
        const chopperLanded = this.isChopperGrounded(48);

        this.hostages.forEach(person => {
            if (
                !person.active ||
                person.rescueState === "contained" ||
                person.rescueState === "queued"
            ) return;

            if (this.isHostageInDanger(person)) {
                this.killHostage(person);
                return;
            }

            if (person.rescueState === "emerging") {
                person.releaseDelay -= dt;
                if (person.releaseDelay > 0) return;

                person.rescueState = "running";
                person.x = person.homeX + 12;
                person.spillTargetX =
                    person.homeX +
                    38 +
                    person.wavePosition * 12 +
                    person.spillOffset;
                person.setVisible(true);
                this.playPersonAnimation(person, "peopleRun");
            }

            const distanceToChopper = this.player.x - person.x;
            const canApproach =
                chopperLanded &&
                this.onboard < this.capacity &&
                Math.abs(distanceToChopper) < 160 &&
                ["running", "waiting", "approaching"].includes(person.rescueState);

            if (canApproach) {
                const direction = Math.sign(distanceToChopper);
                person.rescueState = "approaching";
                person.setFlipX(direction < 0);
                this.playPersonAnimation(person, "peopleRun", true);
                person.x += direction * Math.min(
                    Math.abs(distanceToChopper),
                    dt * person.approachSpeed
                );

                if (Math.abs(this.player.x - person.x) < 12) {
                    person.active = false;
                    person.rescueState = "boarded";
                    person.setVisible(false);
                    this.onboard += 1;
                }
                return;
            }

            if (person.rescueState === "approaching") {
                person.rescueState = "waiting";
                this.playPersonAnimation(person, "peopleHelp");
            }

            if (person.rescueState === "running") {
                person.x = Math.min(
                    person.spillTargetX,
                    person.x + dt * person.spillSpeed
                );
                if (person.x >= person.spillTargetX) {
                    person.rescueState = "waiting";
                    this.playPersonAnimation(person, "peopleHelp");
                }
            }
        });

        this.houses.forEach(house => this.releaseHostageWave(house));
    }

    isHostageInDanger(person) {
        if (!person.visible) return false;

        const bladeHit =
            !this.isChopperGrounded(48) &&
            Math.abs(this.player.x - person.x) < 22 &&
            Math.abs(this.player.y - person.y) < 14;
        const tankHit = this.tanks.some(tank =>
            Math.abs(tank.x - person.x) <
            (tank.displayWidth + person.displayWidth) * 0.35
        );

        return bladeHit || tankHit;
    }

    killHostage(person) {
        person.active = false;
        person.rescueState = "dead";
        person.setVisible(false);
        this.dead += 1;
    }

    updateBaseUnloading(dt) {
        const landedAtBase =
            Math.abs(this.player.x - BASE_X) < 75 &&
            this.isChopperGrounded(30);

        if (landedAtBase && this.onboard > 0) {
            this.unloadCooldown -= dt;
            if (this.unloadCooldown <= 0) {
                const person = this.createPerson(this.player.x, GROUND_Y - 3);
                person.targetX = BASE_X + 40;
                this.playPersonAnimation(person, "peopleRun");
                this.unloadingPeople.push(person);
                this.onboard -= 1;
                this.unloadCooldown = Phaser.Math.FloatBetween(0.25, 0.5);
            }
        } else {
            this.unloadCooldown = 0;
        }

        for (let i = this.unloadingPeople.length - 1; i >= 0; i -= 1) {
            const person = this.unloadingPeople[i];
            const distanceToDoor = person.targetX - person.x;
            const direction = Math.sign(distanceToDoor);

            person.setFlipX(direction < 0);
            person.x += direction * Math.min(
                Math.abs(distanceToDoor),
                dt * person.unloadSpeed
            );
            person.y = GROUND_Y;
            if (Math.abs(person.targetX - person.x) < 1) {
                person.destroy();
                this.unloadingPeople.splice(i, 1);
                this.rescued += 1;
            }
        }
    }

    breachHouse(house) {
        if (house.breached) return;

        house.breached = true;
        house.play("houseSpill");
        house.hostages.forEach(person => {
            person.rescueState = "queued";
        });
        this.releaseHostageWave(house);
    }

    releaseHostageWave(house) {
        if (!house.breached) return;

        const waveStillOutside = house.hostages.some(person =>
            person.active &&
            ["emerging", "running", "waiting"].includes(person.rescueState)
        );
        if (waveStillOutside) return;

        house.hostages
            .filter(person => person.rescueState === "queued")
            .slice(0, HOSTAGE_WAVE_SIZE)
            .forEach((person, index) => {
                person.rescueState = "emerging";
                person.wavePosition = index;
                person.releaseDelay = index * 0.28;
            });
    }

    updateTanks(dt) {
        const maxTankX = BORDER_X - TANK_DISPLAY_WIDTH / 2;
        const playerIsLeftOfBorder = this.player.x < BORDER_X;

        this.tanks.forEach(tank => {
            tank.fireCooldown -= dt;
            if (
                tank.fireCooldown <= 0 &&
                Math.abs(this.player.x - tank.x) <= TANK_FIRE_RANGE
            ) {
                this.fireTankBullet(tank);
                tank.fireCooldown = Phaser.Math.FloatBetween(
                    TANK_FIRE_MIN_INTERVAL,
                    TANK_FIRE_MAX_INTERVAL
                );
            }

            if (playerIsLeftOfBorder) {
                tank.retargetTimer -= dt;
                if (tank.retargetTimer <= 0) {
                    tank.wanderOffset = Phaser.Math.FloatBetween(
                        -TANK_WANDER_DISTANCE,
                        TANK_WANDER_DISTANCE
                    );
                    tank.moveSpeed = Phaser.Math.FloatBetween(20, 34);
                    tank.retargetTimer = Phaser.Math.FloatBetween(0.8, 2.4);
                }

                const targetX = Phaser.Math.Clamp(
                    this.player.x + tank.wanderOffset,
                    TANK_MIN_X,
                    maxTankX
                );
                const distance = targetX - tank.x;

                if (Math.abs(distance) > 3) {
                    tank.direction = Math.sign(distance);
                    tank.x = Math.min(
                        maxTankX,
                        tank.x + tank.direction * Math.min(
                            tank.moveSpeed * dt,
                            Math.abs(distance)
                        )
                    );
                }
            }

            // Frames sweep from right (0) to straight up (3); mirror for left.
            const horizontalAngle = Math.atan2(
                Math.abs(this.player.x - tank.x),
                Math.max(8, tank.y - this.player.y)
            );
            const aimFrame = Phaser.Math.Clamp(
                Math.round(3 - (horizontalAngle / (Math.PI / 2)) * 3),
                0,
                3
            );
            tank
                .setFrame(aimFrame)
                .setFlipX(this.player.x < tank.x);
        });

        const orderedTanks = [...this.tanks].sort((a, b) => a.x - b.x);
        for (let i = 1; i < orderedTanks.length; i += 1) {
            orderedTanks[i].x = Math.max(
                orderedTanks[i].x,
                orderedTanks[i - 1].x + TANK_MIN_GAP
            );
        }

        if (orderedTanks.length > 0) {
            const overflow = orderedTanks[orderedTanks.length - 1].x - maxTankX;
            if (overflow > 0) {
                orderedTanks.forEach(tank => {
                    tank.x -= overflow;
                });
            }

            const underflow = TANK_MIN_X - orderedTanks[0].x;
            if (underflow > 0) {
                orderedTanks.forEach(tank => {
                    tank.x += underflow;
                });
            }
        }
    }

    fireTankBullet(tank) {
        const startX = tank.x;
        const startY = GROUND_Y - 7;
        const projectedPlayerX =
            this.player.x + this.player.body.velocity.x * 0.35;
        const targetX = Phaser.Math.Clamp(
            projectedPlayerX,
            0,
            BORDER_X - 2
        );
        const distance = Math.abs(targetX - startX);
        const duration = Phaser.Math.Clamp(
            distance / TANK_BULLET_SPEED,
            0.7,
            3
        );
        const bullet = this.add.image(startX, startY, "bullet")
            .setScale(BULLET_SCALE)
            .setTint(0xff8a00)
            .setDepth(7);

        bullet.startX = startX;
        bullet.startY = startY;
        bullet.targetX = targetX;
        bullet.targetY = TANK_BULLET_LANDING_Y;
        bullet.elapsed = 0;
        bullet.duration = duration;
        this.tankBullets.push(bullet);
    }

    updateTankBullets(dt) {
        for (let i = this.tankBullets.length - 1; i >= 0; i -= 1) {
            const bullet = this.tankBullets[i];
            bullet.elapsed += dt;
            const progress = Phaser.Math.Clamp(
                bullet.elapsed / bullet.duration,
                0,
                1
            );
            const groundPathY = Phaser.Math.Linear(
                bullet.startY,
                bullet.targetY,
                progress
            );

            bullet.x = Phaser.Math.Linear(
                bullet.startX,
                bullet.targetX,
                progress
            );
            bullet.y =
                groundPathY -
                4 * TANK_BULLET_ARC_HEIGHT * progress * (1 - progress);

            const pathX = bullet.targetX - bullet.startX;
            const pathY =
                bullet.targetY -
                bullet.startY -
                4 * TANK_BULLET_ARC_HEIGHT * (1 - 2 * progress);
            bullet.setRotation(Math.atan2(pathY, pathX));

            const hitChopper =
                !this.chopperDestroyed &&
                Math.abs(bullet.x - this.player.x) <
                this.player.displayWidth * 0.45 &&
                Math.abs(bullet.y - this.player.y) <
                this.player.displayHeight * 0.6;
            if (hitChopper) {
                this.damageChopper();
                bullet.destroy();
                this.tankBullets.splice(i, 1);
                continue;
            }

            if (progress >= 1) {
                this.resolveTankBulletImpact(bullet);
                bullet.destroy();
                this.tankBullets.splice(i, 1);
            }
        }
    }

    resolveTankBulletImpact(bullet) {
        const impactRadius = 18;
        this.createBombBurst(bullet.targetX, bullet.targetY);

        const hitHouse = this.houses.find(house =>
            !house.breached &&
            Math.abs(house.x - bullet.targetX) <
            house.displayWidth * 0.5
        );
        if (hitHouse) {
            this.breachHouse(hitHouse);
        }

        this.hostages.forEach(person => {
            if (
                person.active &&
                person.visible &&
                Math.abs(person.x - bullet.targetX) <= impactRadius
            ) {
                this.killHostage(person);
            }
        });
    }

    createBombBurst(x, y) {
        const burst = this.add.sprite(x, y, "bombBurst", 0)
            .setOrigin(0.5, 1)
            .setScale(ART_SCALE)
            .setDepth(10)
            .play("bombBurst");

        burst.once("animationcomplete", () => burst.destroy());
    }

    createExplosion(
        x,
        y,
        scrollFactor = 1,
        originY = 0.5,
        onComplete = null
    ) {
        const explosion = this.add.sprite(x, y, "explosion", 0)
            .setOrigin(0.5, originY)
            .setScale(ART_SCALE)
            .setScrollFactor(scrollFactor)
            .setDepth(11)
            .play("explosion");

        explosion.once("animationcomplete", () => {
            explosion.destroy();
            if (onComplete) onComplete();
        });
    }

    updateJet(dt) {
        this.jetCooldown = Math.max(0, this.jetCooldown - dt);

        const nearHouse = this.houses.some(house =>
            Math.abs(this.player.x - house.x) <= JET_TRIGGER_DISTANCE
        );

        if (nearHouse && !this.jetNearHouses) {
            this.jetCooldown = Math.max(
                this.jetCooldown,
                Phaser.Math.FloatBetween(0.4, 1.5)
            );
        }
        this.jetNearHouses = nearHouse;

        if (
            nearHouse &&
            !this.jet &&
            this.jetCooldown <= 0
        ) {
            this.createJetPass();
            this.jetCooldown = Phaser.Math.FloatBetween(
                JET_MIN_COOLDOWN,
                JET_MAX_COOLDOWN
            );
        }

        if (!this.jet) return;

        this.jet.elapsed += dt;
        const progress = Phaser.Math.Clamp(
            this.jet.elapsed / JET_PASS_DURATION,
            0,
            1
        );
        const travelWidth = this.cameras.main.width + 100;
        const startX = this.jet.direction > 0
            ? -50
            : this.cameras.main.width + 50;

        this.jet.x = startX + this.jet.direction * travelWidth * progress;
        const playerScreenY =
            this.player.y - this.cameras.main.scrollY;
        const verticalStep = Phaser.Math.Clamp(
            playerScreenY - this.jet.y,
            -JET_VERTICAL_TRACK_SPEED * dt,
            JET_VERTICAL_TRACK_SPEED * dt
        );
        this.jet.y += verticalStep;

        const horizontalStep =
            travelWidth / JET_PASS_DURATION * dt;
        this.jet.setRotation(
            this.jet.direction *
            Math.atan2(verticalStep, horizontalStep)
        );

        const distanceFrame = Math.round(
            Math.abs(progress - 0.5) * 8
        );
        this.jet.setFrame(Phaser.Math.Clamp(distanceFrame, 0, 4));

        this.jet.missileCooldown = Math.max(
            0,
            this.jet.missileCooldown - dt
        );
        if (
            this.jet.missilesRemaining > 0 &&
            this.jet.missileCooldown <= 0 &&
            distanceFrame <= 1 &&
            Math.abs(this.jet.y - playerScreenY) <=
                JET_FIRE_VERTICAL_TOLERANCE
        ) {
            this.fireJetMissile(this.jet);
            this.jet.missilesRemaining -= 1;
            this.jet.missileCooldown = JET_MISSILE_LAUNCH_GAP;
        }

        if (progress >= 1) {
            this.jet.destroy();
            this.jet = null;
        }
    }

    createJetPass() {
        const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        const startX = direction > 0
            ? -50
            : this.cameras.main.width + 50;

        this.jet = this.add.sprite(startX, 28, "jet", 4)
            .setScale(ART_SCALE)
            .setFlipX(direction > 0)
            .setScrollFactor(0)
            .setDepth(9);
        this.jet.direction = direction;
        this.jet.elapsed = 0;
        this.jet.missilesRemaining = 2;
        this.jet.missileCooldown = 0;
    }

    fireJetMissile(jet) {
        const launchOffset = jet.missilesRemaining === 2 ? -3 : 3;
        const missile = this.add.image(
            jet.x + jet.direction * 18,
            jet.y + launchOffset,
            "missile"
        )
            .setScale(MISSILE_SCALE)
            .setFlipX(jet.direction < 0)
            .setScrollFactor(0)
            .setDepth(9);

        missile.velocityX = jet.direction * JET_MISSILE_SPEED;
        missile.velocityY = 0;
        this.jetMissiles.push(missile);
    }

    updateJetMissiles(dt) {
        const playerScreenX = this.player.x - this.cameras.main.scrollX;
        const playerScreenY = this.player.y - this.cameras.main.scrollY;

        for (let i = this.jetMissiles.length - 1; i >= 0; i -= 1) {
            const missile = this.jetMissiles[i];
            missile.x += missile.velocityX * dt;
            missile.velocityY += JET_MISSILE_GRAVITY * dt;
            missile.y += missile.velocityY * dt;

            const missileWorldX =
                missile.x + this.cameras.main.scrollX;
            const crossedBorder =
                missile.velocityX > 0 &&
                missileWorldX + missile.displayWidth * 0.5 >= BORDER_X;
            const hitChopper =
                !crossedBorder &&
                Math.abs(missile.x - playerScreenX) <
                this.player.displayWidth * 0.45 &&
                Math.abs(missile.y - playerScreenY) <
                this.player.displayHeight * 0.6;
            const offscreen =
                missile.x < -30 ||
                missile.x > this.cameras.main.width + 30 ||
                missile.y < -30 ||
                missile.y > this.cameras.main.height + 30;

            if (hitChopper) {
                this.damageChopper();
            }

            if (hitChopper || crossedBorder || offscreen) {
                missile.destroy();
                this.jetMissiles.splice(i, 1);
            }
        }
    }

    damageChopper() {
        if (
            this.chopperCrashing ||
            this.chopperDestroyed ||
            this.respawnInvulnerability > 0
        ) return;

        this.createBombBurst(this.player.x, this.player.y);
        this.chopperCrashing = true;
        this.turnTarget = null;
        this.player.setDrag(60, 0);
        this.player.setAcceleration(0, CHOPPER_CRASH_ACCELERATION);
    }

    updateUfo(dt) {
        const playerIsOverHouse = this.houses.some(house =>
            Math.abs(this.player.x - house.x) <=
            (this.player.displayWidth + house.displayWidth) / 2
        );

        if (
            !this.ufoSpawned &&
            this.rescued > UFO_TRIGGER_RESCUES &&
            playerIsOverHouse
        ) {
            this.createUfo();
        }

        if (!this.ufo) return;

        this.ufo.elapsed += dt;
        const hoverY = Phaser.Math.Clamp(
            this.player.y - 50 + Math.sin(this.ufo.elapsed * 3) * 4,
            22,
            GROUND_Y - 25
        );
        const horizontalSpeed = this.ufo.descending
            ? UFO_DESCENT_SPEED
            : UFO_FOLLOW_SPEED;

        this.ufo.x += Phaser.Math.Clamp(
            this.player.x - this.ufo.x,
            -horizontalSpeed * dt,
            horizontalSpeed * dt
        );
        this.ufo.y += Phaser.Math.Clamp(
            hoverY - this.ufo.y,
            -UFO_DESCENT_SPEED * dt,
            UFO_DESCENT_SPEED * dt
        );

        if (this.ufo.descending && Math.abs(this.ufo.y - hoverY) < 2) {
            this.ufo.descending = false;
        }

        this.ufo.fireCooldown -= dt;
        if (
            this.ufo.fireCooldown <= 0 &&
            this.ufo.x < BORDER_X &&
            !this.chopperCrashing &&
            !this.chopperDestroyed
        ) {
            this.fireUfoBullet();
            this.ufo.fireCooldown = Phaser.Math.FloatBetween(
                UFO_FIRE_MIN_INTERVAL,
                UFO_FIRE_MAX_INTERVAL
            );
        }

        const hitChopper =
            !this.chopperDestroyed &&
            Math.abs(this.ufo.x - this.player.x) <
                (this.ufo.displayWidth + this.player.displayWidth) * 0.4 &&
            Math.abs(this.ufo.y - this.player.y) <
                (this.ufo.displayHeight + this.player.displayHeight) * 0.4;
        if (hitChopper) {
            const impactX = this.ufo.x;
            const impactY = this.ufo.y;
            this.damageChopper();
            this.ufo.destroy();
            this.ufo = null;
            this.createExplosion(impactX, impactY);
        }
    }

    createUfo() {
        this.ufoSpawned = true;
        this.ufo = this.add.sprite(
            this.player.x,
            -12,
            "ufo",
            0
        )
            .setScale(ART_SCALE)
            .setDepth(9)
            .play("ufoHover");
        this.ufo.elapsed = 0;
        this.ufo.descending = true;
        this.ufo.fireCooldown = Phaser.Math.FloatBetween(0.5, 1.2);
    }

    fireUfoBullet() {
        if (!this.ufo) return;

        const deltaX = this.player.x - this.ufo.x;
        const deltaY = this.player.y - this.ufo.y;
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const bullet = this.add.image(
            this.ufo.x,
            this.ufo.y + this.ufo.displayHeight * 0.5,
            "bullet"
        )
            .setScale(BULLET_SCALE)
            .setTint(0x00c8ff)
            .setDepth(9);

        bullet.velocityX = deltaX / distance * UFO_BULLET_SPEED;
        bullet.velocityY = deltaY / distance * UFO_BULLET_SPEED;
        bullet.setRotation(Math.atan2(bullet.velocityY, bullet.velocityX));
        this.ufoBullets.push(bullet);
    }

    updateUfoBullets(dt) {
        for (let i = this.ufoBullets.length - 1; i >= 0; i -= 1) {
            const bullet = this.ufoBullets[i];
            bullet.x += bullet.velocityX * dt;
            bullet.y += bullet.velocityY * dt;

            const crossedBorder =
                bullet.velocityX > 0 &&
                bullet.x + bullet.displayWidth * 0.5 >= BORDER_X;
            const hitChopper =
                !crossedBorder &&
                !this.chopperDestroyed &&
                Math.abs(bullet.x - this.player.x) <
                    this.player.displayWidth * 0.45 &&
                Math.abs(bullet.y - this.player.y) <
                    this.player.displayHeight * 0.6;
            const outOfBounds =
                bullet.x < 0 ||
                bullet.x > BORDER_X ||
                bullet.y < 0 ||
                bullet.y > WORLD_H;

            if (hitChopper) {
                this.damageChopper();
            }

            if (hitChopper || crossedBorder || outOfBounds) {
                bullet.destroy();
                this.ufoBullets.splice(i, 1);
            }
        }
    }

    fire() {
        const forwardFacing = this.facing === "forward";
        const rotation = forwardFacing ? Math.PI / 2 : this.player.rotation;
        const directionX = forwardFacing
            ? 0
            : this.lastDirection * Math.cos(rotation);
        const directionY = forwardFacing
            ? 1
            : this.lastDirection * Math.sin(rotation);
        const muzzleX = directionX * 18;
        const muzzleY = directionY * 18 + (forwardFacing ? 0 : 5);
        const bullet = this.add.image(
            this.player.x + muzzleX,
            this.player.y + muzzleY,
            "bullet"
        )
            .setScale(BULLET_SCALE)
            .setFlipX(!forwardFacing && this.lastDirection > 0)
            .setRotation(rotation)
            .setDepth(7);
        bullet.velocityX = directionX * 230;
        bullet.velocityY = directionY * 230;
        bullet.isBomb = forwardFacing;
        this.bullets.push(bullet);
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
            const bullet = this.bullets[i];
            bullet.x += bullet.velocityX * dt;
            bullet.y += bullet.velocityY * dt;

            const bulletScreenX = bullet.x - this.cameras.main.scrollX;
            const bulletScreenY = bullet.y - this.cameras.main.scrollY;
            const hitJet =
                this.jet &&
                Math.abs(this.jet.x - bulletScreenX) <
                this.jet.displayWidth * 0.5 &&
                Math.abs(this.jet.y - bulletScreenY) <
                this.jet.displayHeight * 0.5;

            if (hitJet) {
                this.createExplosion(this.jet.x, this.jet.y, 0);
                this.jet.destroy();
                this.jet = null;
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            const tankIndex = this.tanks.findIndex(tank =>
                Math.abs(tank.x - bullet.x) < 16 &&
                Math.abs(tank.y - bullet.y) < 12
            );

            if (tankIndex >= 0) {
                const tank = this.tanks[tankIndex];
                this.createExplosion(tank.x, tank.y, 1, 1);
                tank.destroy();
                this.tanks.splice(tankIndex, 1);
                bullet.destroy();
                this.bullets.splice(i, 1);
            } else {
                const house = this.houses.find(candidate =>
                    !candidate.breached &&
                    Math.abs(candidate.x - bullet.x) < 30 &&
                    bullet.y > GROUND_Y - 34
                );

                if (house) {
                    this.createBombBurst(bullet.x, GROUND_Y);
                    this.breachHouse(house);
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                } else if (bullet.isBomb && bullet.y >= TANK_GROUND_Y) {
                    this.createBombBurst(bullet.x, TANK_GROUND_Y);
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                } else if (Math.abs(bullet.x - this.player.x) > 380) {
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                }
            }
        }
    }
}
