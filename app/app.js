import config from './config';


class WaterPhysics {
  constructor(game) {
    this.game = game;
    this.objects = [];

    this.waterDensity = 64;
    this.airDensity = 0.07;

    this.restingLungVolume = 0.04;
    this.maxInhaleLungVolume = 0.21;

    this.pixelsPerAtm = 300;
    this.accelerationConstant = 500;
    this.gravityConstant = 0.98;
  }

  startSystem() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
  }

  enable(obj) {
    this.objects.push(obj);
    this.game.physics.arcade.enable(obj);
    obj.body.pressure = this.ambientPressureAtY(obj.y);
    obj.body.lungs = {
      volume: {
        min: this.restingLungVolume,
        max: this.maxInhaleLungVolume,
        current: this.restingLungVolume
      },
      mass: this.restingLungVolume*Math.pow(2, obj.body.pressure - 1)
    };
  }

  ambientPressureAtY(y) {
    return y / this.pixelsPerAtm + 1;
  }

  volume(mass, pressure) {
    return mass / Math.pow(2, pressure - 1);
  }

  buoyant(obj) {
    obj.body.pressure = this.ambientPressureAtY(obj.y);
    obj.body.lungs.volume.current = this.volume(obj.body.lungs.mass, obj.body.pressure);
    obj.body.acceleration.y = obj.body.weight + ((this.airDensity - this.waterDensity) * this.gravityConstant * obj.body.lungs.volume.current);
  }
}

class Game {
    start() {
      this.game = new Phaser.Game(this.width, this.height, Phaser.AUTO, this.el, { preload: this.preload.bind(this), create: this.create.bind(this), update: this.update.bind(this) });
    }

    preload() {
      this.game.load.image('water', 'assets/sky.png');
      this.game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    }

    create() {
      this.waterPhysics = new WaterPhysics(this.game);
      this.waterPhysics.startSystem();

      var water = this.game.add.sprite(800, 600, 'water');
      // water.anchor.x = 0.5;
      // water.anchor.y = 0.5;
      water.angle = 180;

      // place the player in the middle of the world and make it neutrally buoyant at 2 ATM
      this.player = this.game.add.sprite(400, 300, 'dude');
      this.waterPhysics.enable(this.player);
      this.player.body.weight = 5;
      this.player.body.inhaleRate = 0.01;
      this.player.body.collideWorldBounds = true;
      this.player.frame = 4;

      this.text = this.game.add.text(16, 16, `lungs: ${this.player.body.lungs.mass}`, { fontSize: '32px', fill: '#000' });
      this.text2 = this.game.add.text(16, 48, `pressure: ${this.player.body.pressure}`, { fontSize: '32px', fill: '#000' });
    }

    update() {

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.SPACEBAR)) {
        if (this.player.body.lungs.volume.current < this.player.body.lungs.volume.max) {
          this.player.body.lungs.mass += this.player.body.inhaleRate * this.player.body.pressure;
        }
      } else {
        if (this.player.body.lungs.volume.current > this.player.body.lungs.volume.min) {
          this.player.body.lungs.mass -= this.player.body.inhaleRate * this.player.body.pressure;
        }
      }

      this.text.text = `lungs: ${this.player.body.lungs.mass} - acceleration: ${this.player.body.acceleration.y}`;
      this.text2.text = `volume: ${this.player.body.lungs.volume.current} - pressure: ${this.player.body.pressure}`;
      this.waterPhysics.buoyant(this.player);

    }
}

function main() {
  var game = new Game(800, 600, '#application');
  game.start();
}

main();
