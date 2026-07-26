const WORLD_W = 2636;
const WORLD_H = 180;
const GROUND_Y = 148;
const BASE_X = WORLD_W - 110;
const BASE_Y = GROUND_Y + 4;
const ART_SCALE = 0.5;
const CHOPPER_SCALE = .45;
const CHOPPER_GROUND_Y = 144;
const MOUNTAIN_SCROLL_FACTOR = 0.35;
const HOUSE_SCALE = 0.18;
const BASE_SCALE = 0.3;
const PEOPLE_PER_HOUSE = 20;
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
        this.load.image("bullet", `${ASSET}bullet.png`);

        this.load.spritesheet("hq", `${ASSET}hq.png`, {
            frameWidth: 435,
            frameHeight: 86
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
            frameWidth: 82,
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
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBackgroundColor("#000000");

        this.createAnimations();
        this.createSky();
        this.createTerrain();
        this.createStructures();
        this.createHostages();
        this.createPlayer();
        this.paused = false;
        this.fuel = 66;
        this.onboard = 0;
        this.rescued = 0;
        this.capacity = 8;
        this.lastDirection = -1;
        this.bullets = [];
        this.unloadingPeople = [];
        this.unloadCooldown = 0;
        this.createHud();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,P,R");
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
            this.add.image(x, GROUND_Y - (index % 2), "mountain")
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
            .setScale(BASE_SCALE)
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
        const foregroundX = BASE_X - 300 - cameraScrollX;
        const startingScrollX = WORLD_W - this.cameras.main.width;
        const horizonX = 160 +
            (startingScrollX - cameraScrollX) * MOUNTAIN_SCROLL_FACTOR;
        const horizonY = GROUND_Y + 4;

        this.borderMarkers.forEach(marker => {
            const depth = marker.depthRatio;
            const perspectiveDepth = Math.pow(depth, 0.72);

            marker.x = Phaser.Math.Linear(foregroundX, horizonX, perspectiveDepth);
            marker.y = Phaser.Math.Linear(WORLD_H, horizonY, perspectiveDepth);
            marker.setScale(Phaser.Math.Linear(ART_SCALE, 0.08, perspectiveDepth));
        });
    }

    createTank(x, index) {
        const tank = this.add.sprite(x, GROUND_Y + 20, "tank", 2)
            .setOrigin(0.5, 1)
            .setScale(ART_SCALE)
            .setDepth(5);
        tank.direction = index % 2 ? -1 : 1;
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
            .setScale(ART_SCALE)
            .setDepth(6);
        person.active = true;
        person.animationStartFrames = {
            peopleHelp: Phaser.Math.Between(0, 1),
            peopleRun: Phaser.Math.Between(0, 5)
        };
        person.animationSpeed = Phaser.Math.FloatBetween(0.85, 1.15);
        return person;
    }

    playPersonAnimation(person, key, ignoreIfPlaying = false) {
        person.anims.timeScale = person.animationSpeed;
        person.play({
            key,
            startFrame: person.animationStartFrames[key]
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
    }

    createHud() {
        this.hudFrame = this.add.image(160, 0, "hudFrame")
            .setOrigin(0.5, 0)
            .setScale(ART_SCALE)
            .setScrollFactor(0)
            .setDepth(100);

        const textStyle = {
            fontFamily: "monospace",
            fontSize: "9px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2
        };

        this.house1Text = this.add.text(74, 8, "20", textStyle)
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(101);
        this.house2Text = this.add.text(160, 8, "20", textStyle)
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(101);
        this.house3Text = this.add.text(248, 8, "20", textStyle)
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(101);
        this.updateHouseLifeCounts();

        this.helpText = this.add.text(
            160,
            174,
            "MOVE WASD/ARROWS  FIRE SPACE  PAUSE P",
            {
                fontFamily: "monospace",
                fontSize: "6px",
                color: "#ffffff",
                backgroundColor: "#000000"
            }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(101).setAlpha(0.8);

        this.pauseText = this.add.text(160, 90, "PAUSED", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
            backgroundColor: "#000000"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setVisible(false);
    }

    update(_, deltaMs) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.scene.restart();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            this.paused = !this.paused;
            this.physics.world.isPaused = this.paused;
            this.anims.globalTimeScale = this.paused ? 0 : 1;
            this.pauseText.setVisible(this.paused);
        }
        this.updateBorderMarkers();
        if (this.paused) return;

        const dt = Math.min(deltaMs / 1000, 0.05);
        this.updatePlayer(dt);
        this.updateHostages(dt);
        this.updateBaseUnloading(dt);
        this.updateTanks(dt);
        this.updateBullets(dt);

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.fire();
        }

        this.fuel = Math.max(0, this.fuel - dt * 0.32);
        this.updateHouseLifeCounts();
    }

    updateHouseLifeCounts() {
        this.house1Text.setText(String(this.onboard).padStart(2, "0"));
        this.house2Text.setText(String(Math.ceil(this.fuel)).padStart(2, "0"));
        this.house3Text.setText(String(this.rescued).padStart(2, "0"));
    }

    updatePlayer(dt) {
        if (this.player.y >= CHOPPER_GROUND_Y) {
            this.player.setY(CHOPPER_GROUND_Y);
            this.player.setVelocityY(Math.min(0, this.player.body.velocity.y));
        }

        const landed = this.isChopperGrounded();
        const left = this.keys.A.isDown || (!landed && this.cursors.left.isDown);
        const right = this.keys.D.isDown || (!landed && this.cursors.right.isDown);
        const up = this.keys.W.isDown || this.cursors.up.isDown;
        const down = this.keys.S.isDown || (!landed && this.cursors.down.isDown);

        if (this.fuel > 0) {
            this.player.setAcceleration(
                (right ? 190 : 0) - (left ? 190 : 0),
                (down ? 160 : 0) - (up ? 160 : 0)
            );
        } else {
            this.player.setAcceleration(0, 70);
        }

        if (left || right) {
            this.lastDirection = right ? 1 : -1;
            this.player.setFlipX(this.lastDirection > 0);
        }

        const targetTilt = Phaser.Math.Clamp(
            this.player.body.velocity.x / this.player.body.maxVelocity.x,
            -1,
            1
        ) * 10;
        this.player.setAngle(Phaser.Math.Linear(
            this.player.angle,
            targetTilt,
            Math.min(1, dt * 8)
        ));

        if (Math.abs(this.player.x - BASE_X) < 75 && landed) {
            this.fuel = Math.min(66, this.fuel + dt * 14);
        }
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

            if (person.rescueState === "emerging") {
                person.releaseDelay -= dt;
                if (person.releaseDelay > 0) return;

                person.rescueState = "running";
                person.x = person.homeX + 12;
                person.spillTargetX = person.homeX + 38 + person.wavePosition * 12;
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
                    dt * 34
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
                person.x = Math.min(person.spillTargetX, person.x + dt * 24);
                if (person.x >= person.spillTargetX) {
                    person.rescueState = "waiting";
                    this.playPersonAnimation(person, "peopleHelp");
                }
            }
        });

        this.houses.forEach(house => this.releaseHostageWave(house));
    }

    updateBaseUnloading(dt) {
        const landedAtBase =
            Math.abs(this.player.x - BASE_X) < 75 &&
            this.isChopperGrounded(30);

        if (landedAtBase && this.onboard > 0) {
            this.unloadCooldown -= dt;
            if (this.unloadCooldown <= 0) {
                const person = this.createPerson(this.player.x, GROUND_Y - 6);
                person.targetX = BASE_X + 23;
                this.playPersonAnimation(person, "peopleRun");
                this.unloadingPeople.push(person);
                this.onboard -= 1;
                this.unloadCooldown = 0.35;
            }
        } else {
            this.unloadCooldown = 0;
        }

        for (let i = this.unloadingPeople.length - 1; i >= 0; i -= 1) {
            const person = this.unloadingPeople[i];
            const distanceToDoor = person.targetX - person.x;
            const direction = Math.sign(distanceToDoor);

            person.setFlipX(direction < 0);
            person.x += direction * Math.min(Math.abs(distanceToDoor), dt * 34);

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
        const targetX = Phaser.Math.Clamp(this.player.x, 80, BASE_X - 290);

        this.tanks.forEach(tank => {
            const distance = targetX - tank.x;
            tank.setFlipX(this.player.x < tank.x);

            // The sheet sweeps from right (frame 0), through up (2), to left (4).
            const horizontalAngle = Math.atan2(
                this.player.x - tank.x,
                Math.max(8, tank.y - this.player.y)
            );
            const aimFrame = Phaser.Math.Clamp(
                Math.round(2 - (horizontalAngle / (Math.PI / 2)) * 2),
                0,
                3
            );
            tank.setFrame(aimFrame);

            if (Math.abs(distance) > 3) {
                tank.direction = Math.sign(distance);
                tank.x += tank.direction * Math.min(18 * dt, Math.abs(distance));
            }
        });
    }

    fire() {
        const rotation = this.player.rotation;
        const muzzleX =
            this.lastDirection * 18 * Math.cos(rotation) -
            5 * Math.sin(rotation);
        const muzzleY =
            this.lastDirection * 18 * Math.sin(rotation) +
            5 * Math.cos(rotation);
        const bullet = this.add.image(
            this.player.x + muzzleX,
            this.player.y + muzzleY,
            "bullet"
        )
            .setScale(BASE_SCALE)
            .setFlipX(this.lastDirection > 0)
            .setRotation(rotation)
            .setDepth(7);
        bullet.velocityX = this.lastDirection * Math.cos(rotation) * 230;
        bullet.velocityY = this.lastDirection * Math.sin(rotation) * 230;
        this.bullets.push(bullet);
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
            const bullet = this.bullets[i];
            bullet.x += bullet.velocityX * dt;
            bullet.y += bullet.velocityY * dt;

            const tankIndex = this.tanks.findIndex(tank =>
                Math.abs(tank.x - bullet.x) < 16 &&
                Math.abs(tank.y - bullet.y) < 12
            );

            if (tankIndex >= 0) {
                this.tanks[tankIndex].destroy();
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
                    this.breachHouse(house);
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
