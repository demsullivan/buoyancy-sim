import config from './config';


Object.resolve = function(path, obj) {
  return path.split('.').reduce(function(prev, curr) {
    return prev ? prev[curr] : undefined;
  }, obj || self);
};

class WaterPhysics {
  constructor(game) {
    this.game = game;
    this.objects = [];

    this.waterDensity = 64;
    this.airDensity = 0.07;

    this.restingLungVolume = 0.04;
    this.maxInhaleLungVolume = 0.21;

    this.pixelsPerAtm = 264;
    this.accelerationConstant = 500;
  }

  startSystem(g) {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.gravityConstant = g;
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
    obj.body.bcd = {
      volume: {
        min: 0,
        max: 0.21,
        current: 0
      },
      mass: 0
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
    obj.body.bcd.volume.current = this.volume(obj.body.bcd.mass, obj.body.pressure);

    var totalAirVolume = obj.body.lungs.volume.current + obj.body.bcd.volume.current;
    obj.body.gravity.y = obj.body.weight + ((this.airDensity - this.waterDensity) * this.gravityConstant * totalAirVolume);
  }
}

class Game {
    start(weight, g, inhaleRate) {
      this.weight = weight;
      this.g = g;
      this.inhaleRate = inhaleRate;
      this.game = new Phaser.Game(this.width, this.height, Phaser.AUTO, this.el, { preload: this.preload.bind(this), create: this.create.bind(this), update: this.update.bind(this) });
    }

    preload() {
      this.game.load.image('water', 'assets/sky.png');
      this.game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    }

    create() {
      this.waterPhysics = new WaterPhysics(this.game);
      this.waterPhysics.startSystem(this.g);

      this.debugText = {};

      var water = this.game.add.sprite(800, 600, 'water');
      // water.anchor.x = 0.5;
      // water.anchor.y = 0.5;
      water.angle = 180;

      // place the player in the middle of the world and make it neutrally buoyant at 2 ATM
      this.player = this.game.add.sprite(400, 264, 'dude');
      this.waterPhysics.enable(this.player);
      this.player.body.weight = this.weight;
      this.player.body.inhaleRate = this.inhaleRate;
      this.player.body.collideWorldBounds = true;
      this.player.frame = 4;

      this.createDebugText('lungs.mass');
      this.createDebugText('lungs.volume.current');
      this.createDebugText('pressure');
      this.createDebugText('acceleration.y');
      this.createDebugText('gravity.y');
      this.createDebugText('bcd.mass');
      this.createDebugText('bcd.volume.current');
    }

    createDebugText(attr) {
      if (!this.debugText.__global) {
        this.debugText.__global = { y: 16 };
      } else {
        this.debugText.__global.y += 16;
      }

      var val = Object.resolve(attr, this.player.body);
      this.debugText[attr] = this.game.add.text(16, this.debugText.__global.y, `${attr}: ${val}`, { fontSize: '16px', fill: '#000' });
    }

    updateDebug() {
      for (var attr in this.debugText) {
        if (attr !== '__global') {
          var val = Object.resolve(attr, this.player.body);
          this.debugText[attr].text = `${attr}: ${val}`;
        }
      }
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

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.W)) {
        if (this.player.body.bcd.volume.current < this.player.body.bcd.volume.max) {
        this.player.body.bcd.mass += 0.0001 * this.player.body.pressure;
        }
      }

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.S)) {
        if (this.player.body.bcd.volume.current > this.player.body.bcd.volume.min) {
          this.player.body.bcd.mass -= 0.0001 * this.player.body.pressure;
        }
      }

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.RIGHT)) {
        this.player.x += 0.25;
      }

      if (this.game.input.keyboard.isDown(Phaser.KeyCode.LEFT)) {
        this.player.x -= 0.25;
      }

      this.waterPhysics.buoyant(this.player);
      this.updateDebug();

    }
}

function main() {
  var game = new Game(800, 600, '#application');

  game.start(5, 0.98, 0.01);

  $('.game-var').on('change', function() {
    console.log(`${this.id} changed`);
    switch (this.id) {
      case "weight":
        game.player.body.weight = new Number(this.value);
      case "g":
        game.waterPhysics.gravityConstant = new Number(this.value);
      case "inhale-rate":
        game.player.body.inhaleRate = new Number(this.value);
    }
  });

  $('#reset').on('click', function() {
    console.log("RESET");
    game.game.destroy();

    var weight = new Number($('#weight').val());
    var g = new Number($('#g').val());
    var inhaleRate = new Number($('#inhale-rate').val());

    game = new Game(800, 600, '#application');
    game.start(weight, g, inhaleRate);
  });
}

main();
