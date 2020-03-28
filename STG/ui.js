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

class SoundPlayer{
  constructor(){
    this.bgm = new Audio("sound/BGM/theme1.mp3");
    this.bgm.addEventListener("ended",function(){
//      this.bgm.currentTime = 0;
      this.bgm.play();
    },false);
    this.effect = new Audio("sound/effect/short1.mp3");
  }
  startBGM(){
    this.bgm.play();
  }
  stopBGM(){
    this.bgm.pause();
  }
  playEffect(){
    this.effect.play();
  }
}
