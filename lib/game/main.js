ig.module(
        'monsterGame'
    )
    .requires(
        'impact.game',
        'impact.entity',
        'impact.collision-map',
        'impact.background-map',
        'impact.font',
        'plugins.parallax',
        'plugins.camera',
        'plugins.touch-button',
        'plugins.virtualjoystick',
        'plugins.impact-splash-loader',
        'plugins.gamepad',
        'plugins.webstorage'
    )
    .defines(function() {
        // Collectable Entity
        // creamy
        Entitycandy = ig.Entity.extend({
            size: {
                x: 65,
                y: 70
            },
            offset: {
                x: 2.5,
                y: 0
            },

            animSheet: new ig.AnimationSheet('media/Tiles/creamVanilla.png', 70, 70),
            type: ig.Entity.TYPE.B,

            splashSfx: new ig.Sound('media/splash.*'),

            init: function(x, y, settings) {
                this.addAnim('idle', 1, [0]);
                this.parent(x, y, settings);
            },

            update: function() {
                this.parent();
                if (this.pos.y - ig.game.screen.y < -32) {
                    this.kill();
                }
            },

            pickup: function() {
                ig.game.score += 500;
                this.splashSfx.play();
                this.kill();
            }
        });


        // Entity Player
        // main hero
        EntityPlayer = ig.Entity.extend({
            health: 0,
            speed: 100,
            health: 5,
            maxHealth: 5,

            checkAgainst: ig.Entity.TYPE.B,
            animSheet: new ig.AnimationSheet( 'media/player.png', 75, 100 ),	
            
            size: {x: 40, y: 88},
            offset: {x: 17, y: 10},

            jump: 600,

            maxVel: {
                x: 400,
                y: 800
            },
            friction: {
                x: 800,
                y: 0
            },

            speed: 300,
            bounciness: 0.433333333,
            leapSfx: new ig.Sound('media/leap.*'),

            init: function(x, y, settings) {
                this.addAnim( 'idle', 1, [15,15,15,15,15,14] );
                this.addAnim( 'run', 0.07, [4,5,11,0,1,2,7,8,9,3] );
                this.addAnim( 'jump', 1, [13] );
                this.addAnim( 'fall', 0.4, [13,12], true ); // stop at the last frame
                this.addAnim( 'pain', 0.3, [6], true );
                this.parent(x, y, settings);
            },

            update: function() {
                // analyze user Input
                if (ig.input.state('left')) {
                    this.flip = true;
                    this.accel.x = -this.speed;
                } else if (ig.input.state('right')) {
                    this.flip = false;
                    this.accel.x = this.speed;
                } else if (this.standing && ig.input.pressed('jump')) {
                    this.vel.y = -this.jump;
                    this.leapSfx.play();
                } else {
                    this.accel.x = 0;
                }

                if (this.vel.y < 0) {
                    this.currentAnim = this.anims.jump;
                } else if (this.vel.y > 0) {
                    if (this.currentAnim != this.anims.fall) {
                        this.currentAnim = this.anims.fall.rewind();
                    }
                } else if (this.vel.x != 0) {
                    this.currentAnim = this.anims.run;
                } else {
                    this.currentAnim = this.anims.idle;
                }

                this.currentAnim.flip.x = this.flip;

                this.parent();
            },

            handleMovementTrace: function(res) {
                if (res.collision.y && this.vel.y > 32) {
                    // standing on choco
                    // bouncing sound normally
                }
                this.parent(res);
            },

            check: function(other) {
                // award creamy sauce
                // increase health
                this.health++;
                other.pickup();
            }
        });

        // The actual Game Source
        monsterGame = ig.Game.extend({
            clearColor: null, // "#d0f4f7",
            gravity: 800, // subjected to everyone
            loadbg1: new ig.Image('media/Background/bg_layer1.png'),
            loadbg2: new ig.Image('media/Background/bg_layer2.png'),
            loadbg3: new ig.Image('media/Background/bg_layer3.png'),
            loadbg4: new ig.Image('media/Background/bg_layer4.png'),

            // Load a font
            font: new ig.Font('media/fredoka-one.font.png'),

            player: null,

            map: [],
            score: 0,
            speed: 100,
            highscore: this.highscore = ig.Webstorage.get('highscore'),

            // HUD icons
            heartFull: new ig.Image('media/heart-full.png'),
            heartEmpty: new ig.Image('media/heart-empty.png'),
            music: new ig.Sound('media/sound/Dungeon Theme.*'),
			hurtSfx: new ig.Sound('media/hurt.*'),
			
            init: function() {
                // uncomment this next line for more authentic (choppy) scrolling
                //ig.system.smoothPositioning = false; 
                this.font.letterSpacing = -2;
                ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
                ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
                ig.input.bind(ig.KEY.ENTER, 'jump'); //
                ig.input.bind(ig.KEY.P, 'pause'); // any key

                // ig.input.bind(ig.GAMEPAD.PAD_LEFT, 'left');
                // ig.input.bind(ig.GAMEPAD.PAD_RIGHT, 'right');

                // The first part of the map is always the same
                this.map = [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                ];
                // Now randomly generate the remaining rows
                for (var y = 8; y < 18; y++) {
                    this.map[y] = this.getRow();
                }

                // The map is used as CollisionMap AND BackgroundMap
                this.collisionMap = new ig.CollisionMap(70, this.map);
                this.backgroundMaps.push(new ig.BackgroundMap(70, this.map, 'media/Tiles/cake.png'));
                this.player = this.spawnEntity(EntityPlayer, ig.system.width / 2 - 2, 16);

                if (window.myTouchButtons) {
                    window.myTouchButtons.align();
                }

                this.parallax = new Parallax();
                this.parallax.add('media/Background/bg_layer4.png', {
                    distance: 10,
                    y: -1024
                });
            },

            respawn: function() {
                this.map.push(this.getRow());
                this.player.pos.x = ig.system.width / 2 - 2;
                this.player.pos.y = 16;

            },

            getRow: function() {
                // Randomly generate a row of block for the map. This is a naive approach,
                // that sometimes leaves the player hanging with no block to jump to. It's
                // random after all.
                var row = [];
                for (var x = 0; x < 20; x++) {
                    row[x] = Math.random() > 0.93 ? 1 : 0;
                }
                return row;
            },


            placecandy: function() {
                // Randomly find a free spot for the candy, max 12 tries
                for (var i = 0; i < 20; i++) {
                    var tile = (Math.random() * 70).ceil();
                    if (
                        this.map[this.map.length - 1][tile] &&
                        !this.map[this.map.length - 2][tile]
                    ) {
                        var y = (this.map.length - 1) * 70;
                        var x = tile * 70 + 1;
                        this.spawnEntity(Entitycandy, x, y);
                        return;
                    }
                }
            },


            update: function() {
                this.parent();

                if (this.gameOver && (ig.input.pressed('left') || ig.input.pressed('right') || ig.input.pressed('pause') || ig.input.pressed('jump'))) {
                    ig.system.setGame(monsterGame);
                }
                if ((ig.input.pressed('pause'))) {
                    if (this.gamePaused) {
                        // resume game ...
                        this.gamePaused = false;
                    } else {
                        // pause game
                        this.gamePaused = true;
                    }
                }
                if (this.gameOver || this.gamePaused) {
                    return;
                }

                this.speed += ig.system.tick * (10 / this.speed);
                this.screen.y += ig.system.tick * this.speed;
                this.score += ig.system.tick * this.speed / 10;

                // Do we need a new row?
                if (this.screen.y > 70) {

                    // Move screen and entities one tile up
                    this.screen.y -= 70;
                    for (var i = 0; i < this.entities.length; i++) {
                        this.entities[i].pos.y -= 70;
                    }

                    // Delete first row, insert new
                    this.map.shift();
                    this.map.push(this.getRow());

                    // Place candy?
                    if (Math.random() > 0.1) {
                        this.placecandy();
                    }
                }

                // check for gameover
                var pp = this.player.pos.y - this.screen.y;
                if (pp > ig.system.height + 70 || pp < -70) {
                    // if life return to starting point tiles

                    if (this.player.health > 0) {
                        for (i = 0; i < 7; i++) {
                            this.map[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }
                        this.map[6] = [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0];
                        this.respawn();
                        this.player.health--;
                    } else { // no money
                        this.highscore = ig.Webstorage.get('highscore');
                        if (this.score > this.highscore)
                            this.highscore = ig.Webstorage.set('highscore', this.score.floor());
                        // end
                        this.gameOver = true;
                    }

                    if (navigator.vibrate) navigator.vibrate([100, 10, 500]);
                    this.hurtSfx.play();
                }
                var player = this.getEntitiesByType(EntityPlayer)[0];
                if (player) {
                    this.screen.x = player.pos.x - ig.system.width / 2;
                    // this.screen.y = player.pos.y - ig.system.height/2;
                }

                this.parallax.move(this.speed * 10); //speed
            },


            draw: function() {
                ig.system.clear('#d0f4f7');
                this.parallax.draw();
                this.parent();
                if (window.myTouchButtons) {
                    window.myTouchButtons.draw();
                }

                if (!window.gameStarted) {
                    this.font.draw('Speshie #6038 freeFall', ig.system.width / 2, ig.system.height / 2 - 100, ig.Font.ALIGN.CENTER);
                    this.font.draw(' highscore ' + this.highscore.floor(), ig.system.width / 2, ig.system.height / 2 - 50, ig.Font.ALIGN.CENTER);
                    this.font.draw(ig.ua.mobile ? 'Press Any Button' : 'Press P to pause , Enter ', ig.system.width / 2, ig.system.height / 2, ig.Font.ALIGN.CENTER);
                    this.font.draw(' to start !', ig.system.width / 2, ig.system.height / 2 + 50, ig.Font.ALIGN.CENTER);
                } else if (this.gameOver) {
                    this.font.draw('Game Over!', ig.system.width / 2, ig.system.height / 2 - 100, ig.Font.ALIGN.CENTER);
                    this.font.draw('score ' + this.score.floor() + ' : highscore ' + this.highscore.floor(), ig.system.width / 2, ig.system.height / 2 - 50, ig.Font.ALIGN.CENTER);
                    this.font.draw(ig.ua.mobile ? 'Press Any Button' : 'Press Enter', ig.system.width / 2, ig.system.height / 2, ig.Font.ALIGN.CENTER);
                    this.font.draw('to Restart !', ig.system.width / 2, ig.system.height / 2 + 50, ig.Font.ALIGN.CENTER);
                } else if (this.gamePaused) {
                    this.font.draw('Game Paused!', ig.system.width / 2, ig.system.height / 2 - 100, ig.Font.ALIGN.CENTER);
                    this.font.draw('score ' + this.score.floor() + ' : highscore ' + this.highscore.floor(), ig.system.width / 2, ig.system.height / 2 - 50, ig.Font.ALIGN.CENTER);
                    this.font.draw(ig.ua.mobile ? 'Press back' : 'Press Back', ig.system.width / 2, ig.system.height / 2, ig.Font.ALIGN.CENTER);
                    this.font.draw('to Resume!', ig.system.width / 2, ig.system.height / 2 + 50, ig.Font.ALIGN.CENTER);
                } else {
                    // go-ahead
                }

                if (this.player) {
                    var x = 16,
                        y = 16;

                    for (var i = 0; i < this.player.maxHealth; i++) {
                        if (this.player.health > i) {
                            this.heartFull.draw(x, y);
                        } else {
                            this.heartEmpty.draw(x, y);
                        }
                        x += this.heartEmpty.width + 8;
                    }
                    this.font.draw('x ' + this.player.health, x, y + 10)
                }

                this.font.draw(this.score.floor().toString(), ig.system.width - 16, 16, ig.Font.ALIGN.RIGHT);
            }
        });

        mainGame = monsterGame.extend({
            update: function() {
                if (ig.input.pressed('left') || ig.input.pressed('right') || ig.input.pressed('pause') || ig.input.pressed('jump')) {
                    // Oh Yeah.
                    // music please!
                    this.music.loop = true;
                    this.music.volume = 0.5;
                    this.music.play();
					// Game on!
                    window.gameStarted = true;
                    ig.system.setGame(monsterGame);
                }
            }
        });

        if (ig.ua.mobile) {
            // Use the TouchButton Plugin to create a TouchButtonCollection that we
            // can draw in our game classes.

            // Touch buttons are anchored to either the left or right and top or bottom
            // screen edge.
            var buttonImage = new ig.Image('media/controls.png');
            myTouchButtons = new ig.TouchButtonCollection([
                new ig.TouchButton('jump', {
                    right: 32,
                    bottom: 128
                }, 100, 100, buttonImage, 2),
                new ig.TouchButton('pause', {
                    right: 160,
                    bottom: 32
                }, 100, 100, buttonImage, 15),	
		new ig.TouchButton('left', {
                    left: 32,
                    bottom: 32
                }, 100, 100, buttonImage, 0),
                new ig.TouchButton('right', {
                    left: 192,
                    bottom: 32
                }, 100, 100, buttonImage, 1)
            ]);
        }

        // If our screen is smaller than 640px in width (that's CSS pixels), we scale the 
        // internal resolution of the canvas by 2. This gives us a larger viewport and
        // also essentially enables retina resolution on the iPhone and other devices 
        // with small screens.
        var scale = (window.innerWidth < 640) ? 2 : 1;


        // We want to run the game in "fullscreen", so let's use the window's size
        // directly as the canvas' style size.
        var canvas = document.getElementById('canvas');
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';


        // Listen to the window's 'resize' event and set the canvas' size each time
        // it changes.
        window.addEventListener('resize', function() {
            // If the game hasn't started yet, there's nothing to do here
            if (!ig.system) {
                return;
            }

            // Resize the canvas style and tell Impact to resize the canvas itself;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ig.system.resize(window.innerWidth * scale, window.innerHeight * scale);

            // Re-center the camera - it's dependend on the screen size.
            if (ig.game && ig.game.setupCamera) {
                ig.game.setupCamera();
            }

            // Also repositon the touch buttons, if we have any
            if (window.myTouchButtons) {
                window.myTouchButtons.align();
            }
        }, false);

        // Finally, start the game into MyTitle and use the ImpactSplashLoader plugin 
        // as our loading screen
        var width = window.innerWidth * scale,
            height = window.innerHeight * scale;

        ig.main('#canvas', mainGame, 60, width, height, 1, ig.ImpactSplashLoader);

    });
