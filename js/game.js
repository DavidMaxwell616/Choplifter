const game = new Phaser.Game(640, 400, Phaser.ARCADE, 'game', {
    preload,
    create,
    update,
   });
  
   function create() {
      if (!startGame) mainMenuCreate(this);
      else gameCreate();
    }
  
  function gameCreate() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    mountains = game.add.group();
    BuildWorld();
    player = game.add.sprite(210,300,"player"); 
    var anim = player.animations.add('player', [0,1,2,3],20, true);
    anim.play();

  }

  function BuildWorld(){
    scoreboard = game.add.image(0,0,"scoreboard"); 
    
    for (let index = 0; index < 2; index++) {
      var mountain = game.add.image(320+index*10, 318, 'mountain');
      mountains.add(mountain);
    }
    background = game.add.image(0, 326, 'background');
    hq = game.add.sprite(20, 280, 'hq');
    var anim = hq.animations.add('hq', [0,1],4, true);
    anim.play();
  }

  function update(){
    if (!startGame)
      return;    
  }

