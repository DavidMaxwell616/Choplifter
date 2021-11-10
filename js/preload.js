function preload() {
    game.load.onLoadStart.add(loadStart, this);
    game.load.onFileComplete.add(fileComplete, this);
    game.load.onLoadComplete.add(loadComplete, this);
    loadText = game.add.text(32, 32, '', {
      fill: '#ffffff',
    });
  
    this.load.path = 'assets/images/';
    this.load.image('splash', 'splash.png');
    this.load.image('mountain', 'mountain.png');
    this.load.image('moon', 'moon.png');
    this.load.image('border', 'border marker.png');
    this.load.image('scoreboard', 'scoreboard.png');
    this.load.image('background', 'background.png');
    this.load.spritesheet('house', 'house.png',61,41);
    this.load.spritesheet('hq', 'hq.png',358,66);
    this.load.spritesheet('player', 'chopper.png',80,46);
    this.load.spritesheet('star', 'stars.png',8,5);
 
    this.load.start();
  }
  
  function loadStart() {
    loadText.setText('Loading ...');
  }
  
  function loadComplete() {
    loadText.setText('Load Complete');
  }
 
  function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
  
    loadText.setText("File Complete: " + progress + "% - " + totalLoaded + " out of " + totalFiles);
  
  loadText.visible = false;
  }