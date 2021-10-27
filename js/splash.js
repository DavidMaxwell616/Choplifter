function mainMenuCreate(scene) {
    splash = scene.add.image(0, 0, 'splash');
    splash.anchor.setTo(0, 0);
    splash.width = game.width;
    splash.height = game.height;
    game.input.onDown.addOnce(StartGame, this);
    game.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
   
    game.input.keyboard.onUpCallback = function (e) {
      if (e.keyCode == Phaser.Keyboard.SPACEBAR) 
        StartGame(scene);
    }
  }
  
  function StartGame(scene){
    if (startGame)
    return;
  splash.visible = false;
  startGame = true;
  gameCreate(scene);
  }