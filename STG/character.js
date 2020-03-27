//////////////////////
/// enemy
//////////////////////

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
      Array.prototype.push.apply(globalBullets.instance[1],bullets);
    }

    if(now - this.timer2 > 0.07){
      this.timer2 = now;
      const r2 = 0.3;
      const num2 = 23;
      const theta = 2.0 * Math.PI / num2 * this.rotCount;
      this.rotCount = (this.rotCount + 1) % num2;
      const b = setBullet(now,[this.x+r2*Math.sin(theta),this.y-r2*aspect*Math.cos(theta),0.0,theta],10.0);
      globalBullets.instance[0].push(b);
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

////////////////////////////
/// me
////////////////////////////
class ShotGenerator{
  constructor(x,y){
    this.relX = x; // relative position to me
    this.relY = y;
    this.interval = 0.3;
    this.prevShot = -100.0;
  }
  generateShot(now,mePos,shots){
    if(now - this.prevShot < this.interval){
      return;
    }
    this.prevShot = now;
    const data = {
      start: now,
      pos: [mePos[0]+this.relX,mePos[y]+this.relY],
      lifetime: 10.0,
    }
    shots.straight.push(data);
    shots.tracking.push(data);
  }
}
class Shots{
  constructor(){
    this.primitive =
    this.straight = {
      pos: [],
      primitive: getShot(),
      speed: 0.1,
    };
    this.tracking = {
      pos: [],
      primitive: getShot(),
      speed: 0.1,
    };
  }
  updatePosition(now,enemies){
    for(let i = 0; i < this.straight.pos.length; i++){
      this.straight.pos[i][1] -= this.straight.speed;
    }
    for(let i = 0; i < this.tracking.pos.length; i++){
      let myPos = this.tracking.pos[i];
      let ePos = findNearEnemy(myPos,enemies);
      let dir = [ePos[0] - mypos[0],ePos[1] - mypos[0]];
      let r = norm(dir);
      let normDir = [dir[0]/r,dir[1]/r];
      myPos[0] += normDir[0] * this.tracking.speed;
      mypos[1] += normDir[1] * this.tracking.speed;
    }
  }
  findNearEnemy(pos,enemies){
    let minDist = 10000.0;
    let minPos = [pos[0],pos[1]-10000.0];
    for(let i = 0; i < enemies.length; i++){
      let ePos3 = enemies[i].charPos();
      let ePos = [ePos3[0],ePos3[1]];
      let dist = distance(pos,epos);
      if(dist < minDist){
        minDist = dist;
        minPos = ePos;
      }
    }
    return minPos;
  }
}
class Me{
  constructor(gl,x,y,r){
    this.r = r;
    this.x = x;
    this.y = y;
    this.core = getCore(r);
    this.buffers = initBuffers(gl,this.core);
    this.move = moveConstantVelocity(0.0,[0.0,0.0]);
    this.transparent = 1.0;

    this.shotSpeed = 0.2;
    this.shotGenerators = [new ShotGenerator(0.0,r+0.1)];
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
  shot(now,shots){
    for(let i = 0; i < shotGenerators.length; i++){
      shotGenerators[i].generateShot(now,this.pos(),shots);
    }
  }

  collisionDetected(objData,elasped){
  	const bullets = objData.bullets;
  	const modelViewMatrix = objData.modelViewMatrix;

  	const posMe = this.pos();

  	//for all bullets
  	for(let i = 0; i < bullets.instance.length; i++){
  		const primitive = bullets.primitives[i];
  		const move = bullets.moves[i];
  		for(let j = 0; j < bullets.instance[i].length; j++){
    		const centerInfo = getBulletCenterInfo(move,bullets.instance[i][j],elasped);
    		const posBulletCenter = centerInfo.center;
    		const theta = centerInfo.theta;

  			// is near enough to check in detail?
  			if(distance(posMe,posBulletCenter) > modelViewMatrix[0] * (this.r+primitive.size)){
  				continue;
  			}
  			// calculate outer vertex position(relative to center pos)
  			const vnum = primitive.outer.length;
  			const posArray = getModifiedPrimitivePos(primitive,theta,modelViewMatrix);
  			const posM = [posMe[0]-posBulletCenter[0],posMe[1]-posBulletCenter[1]];
  			// compare posArray and posM(not PosMe!)
  			if(isInner(vnum,posArray,posM)){
  				return true;
  			}
  			if(isTouched(vnum,posArray,posM,modelViewMatrix[0] * this.r)){
  				return true;
  			}
  		}
  	}
  	return false;
  }
}
