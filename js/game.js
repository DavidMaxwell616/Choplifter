const game = new Phaser.Game(700, 500, Phaser.ARCADE, 'game', {
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
  game.world.setBounds(0, 0, 2630, playerStartY+50);
  mountains = game.add.group();
  houses = game.add.group();
  stars = game.add.group();
  houses = game.add.group();
  border = game.add.group();
  BuildWorld();
  player = game.add.sprite(playerStartX,playerStartY,"player"); 
  player.xv = 0;
  player.yv = 0;
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true

  var anim = player.animations.add('player', [0,1,2,3],20, true);
  anim.play();
  cursors = game.input.keyboard.createCursorKeys();
  fireKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  game.camera.follow(player);
}

function BuildWorld(){
  scoreboard = game.add.image(game.camera.x+2,0,"scoreboard"); 
  moon = game.add.image(100, playerStartY-230, 'moon');
  background = game.add.image(0, playerStartY+30, 'background');
  for (let index = 0; index < 12; index++) {
    var dist = game.rnd.integerInRange(22,50);
    var mountainX = 420+index*(dist*10);
    var mountain = game.add.image(mountainX,playerStartY+22, 'mountain');
    mountain.startX = mountainX;
    mountains.add(mountain);
  }

  for (let index = 0; index < NUM_STARS; index++) {
    var starX = game.rnd.integerInRange(0,game.width);
    var starY = game.rnd.integerInRange(0,game.height);
    var star = game.add.image(starX,starY, 'star');
    star.startX = starX;
    star.frame = game.rnd.integerInRange(0,2);
    stars.add(star);
  }

  for (let index = 0; index < 3; index++) {
    var house = game.add.image(1600+index*400,playerStartY, 'house');
    houses.add(house);
  }
    
  hq = game.add.sprite(20, playerStartY-24, 'hq');
  var anim = hq.animations.add('hq', [0,1],4, true);
  anim.play();
  var increment = 2;
  
  for (let index = 0; index <8; index++) {
    var dist = index*increment;
    var borderPost = game.add.image(postX,(playerStartY+30)+dist, 'border');
    borderPost.scale.setTo(index/10);
    borderPost.moveX = index/10;
    increment+=1;
    postX+=20;
    borderPost.startX = postX;
   border.add(borderPost);
  }
  game.world.bringToTop(border);    
}

  function update(){
    if (!startGame)
      return;    

    if(!gameOver)
      { 
      stars.forEach(star => {
        star.x = game.camera.x + star.startX;
        if(game.rnd.integerInRange(0,200)<10)
          star.frame = game.rnd.integerInRange(0,2);
      });
      mountains.forEach(mountain => {
        mountain.x = (game.camera.x +mountain.startX)* 0.5;   
      });

      border.forEach(post => {
          post.x = post.startX-(game.camera.x*post.moveX);
      });
      scoreboard.x = game.camera.x+2;
      moon.x = game.camera.x+100;
      if(player.y<playerStartY)
        {
          player.yv=0;
        }
      else
      {
        player.yv = 0;
      }
      player.y+=player.yv;

          if (cursors.left.isDown)
      {
        player.x-=5;
      }
      else if (cursors.right.isDown)
      {
        player.x+=5;
      }
      else if (cursors.up.isDown)
      {
        player.y-=5;
      }
      else if (cursors.down.isDown)
      {
      }
    }
  }

