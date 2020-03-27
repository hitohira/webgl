class Inputs {
  constructor(){
    this.come = false;
    this.shift = false;
    this.right = false;
    this.left = false;
    this.up = false;
    this.down = false;
    this.shot = false;
    this.bomb = false;
  }
  update(me){
    const ds = this.shift ? 0.004 : 0.012;

    if(this.up){
      me.updatePosition(0.0,-ds);
    }
    if(this.down){
      me.updatePosition(0.0,ds);
    }
    if(this.left){
      me.updatePosition(-ds,0.0);
    }
    if(this.right){
      me.updatePosition(ds,0.0);
    }
  }
}

function addUIEvent(me,inputs){
  document.addEventListener('keydown', (event) => {
    this.come = true;
    switch(event.keyCode){
      case 16: // shift
        inputs.shift = true;
        break
      case 37: // left arrow
        inputs.left = true;
        break;
      case 38: // top arrow
        inputs.up = true;
        break;
      case 39: // right arrow
        inputs.right = true;
        break;
      case 40: // bottom arrow
        inputs.down = true;
        break;
      case 88: // x
        inputs.bomb = true;
          break;
      case 90: // z
        inputs.shot = true;
          break;
      default:
        break;
    }
  });
  document.addEventListener('keyup', (event) => {
    switch(event.keyCode){
      case 16: // shift
        inputs.shift = false;
        break
      case 37: // left arrow
        inputs.left = false;
        break;
      case 38: // top arrow
        inputs.up = false;
        break;
      case 39: // right arrow
        inputs.right = false;
        break;
      case 40: // bottom arrow
        inputs.down = false;
        break;
      case 88: // x
        inputs.bomb = false;
          break;
      case 90: // z
        inputs.shot = false;
          break;
      default:
        break;
    }
  });
}

class Music{
  constructor(mp3file){
    this.music = new Audio(mp3file);
    this.music.addEventListener("ended",function(){
      this.music.currentTime = 0;
      music.play();
    },false);
  }
  start(){
    this.music.play();
  }
  stop(){
    this.music.pause();
  }
}
