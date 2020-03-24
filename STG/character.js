class Me{
  constructor(gl,x,y,r){
    this.r = r;
    this.x = x;
    this.y = y;
    this.core = getCore(r);
    this.buffers = initBuffers(gl,this.core);
    this.move = moveConstantVelocity(0.0,[0.0,0.0]);
    this.transparent = 1.0;
  }
  pos(){
    return [this.x,this.y];
  }
  updatePosition(dx,dy){
    this.x += dx;
    this.y -= dy;
    if(this.x > 1.0){
      this.x = 1.0;
    }
    else if(this.x < -1.0){
      this.x = -1.0;
    }
    if(this.y > 1.0){
      this.y = 1.0;
    }
    else if(this.y < -1.0){
      this.y = -1.0;
    }
  }
}

class Witch{
  constructor(gl,x,y,then){
    this.x = x;
    this.y = y;
    this.theta = 0.0;
    this.timer = then;
    this.thetaOfs = 0.0;
    this.timer2 = then;
    this.rotCount = 0;
    this.transparent = 1.0;

    const vsSource = vsCodeTex();
    const fsSource = fsCodeTex();
    this.shader = initShaderProgram(gl,vsSource,fsSource);
    this.textures = [];

    loadTexture(gl,"img/Witch.png",this.textures);
  	const board = textureBoard();
  	this.buffers = initBuffersTex(gl,board);
    this.attribL = textureAttribLocations(gl,this.shader);
    this.uniformL = textureUniformLocations(gl,this.shader);
  }

  generateBullets(gl,now,globalBullets){
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    if(now - this.timer > 1.0){
      this.timer = now;
      const r = 0.2;
      const num = 32;
      let bullets = [];
      for(let i = 0; i < num; i++){
        const theta = 2.0 * Math.PI / num * i + this.thetaOfs;
        const b = setBullet(now,[this.x+r*Math.sin(theta),this.y-r*aspect*Math.cos(theta),0.0,theta],15.0);
        bullets.push(b);
      }
      this.thetaOfs += Math.PI / 12.0;
      Array.prototype.push.apply(globalBullets[1],bullets);
    }

    if(now - this.timer2 > 0.07){
      this.timer2 = now;
      const r2 = 0.3;
      const num2 = 23;
      const theta = 2.0 * Math.PI / num2 * this.rotCount;
      this.rotCount = (this.rotCount + 1) % num2;
      const b = setBullet(now,[this.x+r2*Math.sin(theta),this.y-r2*aspect*Math.cos(theta),0.0,theta],10.0);
      globalBullets[0].push(b);
    }
  }

  charPos(){
    return [this.x,this.y,0.0,this.theta];
  }
  draw(gl,modelViewMatrix){
    if(this.textures.length > 0){
      drawTexture(gl,
        this.shader,
        modelViewMatrix,
        this.attribL,
        this.uniformL,
        this.buffers,
        this.textures[0],
        this.charPos(),
        this.transparent
      );
    }
  }
}
