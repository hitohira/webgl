//////////////////////
/// enemy
//////////////////////
class Bullets{
	constructor(gl,primitives,buffers,moves){
		this.primitives = primitives;
		this.buffers = buffers;
    const vsSource = vsCode();
    const fsSource = fsCode();
    this.shader = initShaderProgram(gl,vsSource,fsSource);
    this.attribL = initVsAttribL(gl,this.shader);
    this.uniformL = initVsUniformL(gl,this.shader);
		this.moves = moves;
		this.instance = Array(moves.length);
		for(let i = 0; i < moves.length; i++){
			this.instance[i] = [];
		}
		this.timer = 0.0;
	}
  draw(gl,modelViewMatrix,elasped){
    gl.useProgram(this.shader);
    setUniformModelViewMatrix(gl,modelViewMatrix,this.uniformL);
    gl.uniform1f(this.uniformL.elasped,elasped);
    for(let i = 0; i < this.instance.length; i++){
      enableBuffers(gl,this.attribL,this.uniformL,this.buffers[i]);
      setUniformMoveB(gl,this.uniformL,this.moves[i]);
      for(let j = 0; j < this.instance[i].length; j++){
        setUniformBullet(gl,this.uniformL,this.instance[i][j]);
        gl.drawElements(gl.TRIANGLES,this.buffers[i].length,gl.UNSIGNED_SHORT,0);
      }
    }
  }
	// TODO 処理が重いようならQueueを使うなりして削除のコストを下げるべし
	garbageCollection(now){
		if(now - this.timer < 1.0){
			return;
		}
		for(let i = 0; i < this.instance.length; i++){
			for(let j = 0; j < this.instance[i].length; j++){
				if(this.instance[i][j].lifetime < now - this.instance[i][j].start){
					this.instance[i].splice(0,j);
				}
			}
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
    this.size = board.size;
  	this.buffers = initBuffersTex(gl,board);
    this.attribL = textureAttribLocations(gl,this.shader);
    this.uniformL = textureUniformLocations(gl,this.shader);
  }

  generateBullets(gl,now,objData){
    const globalBullets = objData.bullets;
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
      objData.soundPlayer.playEffect();

			Array.prototype.push.apply(globalBullets.instance[2],bullets);

    }

    if(now - this.timer2 > 0.07){
      this.timer2 = now;
      const r2 = 0.3;
      const num2 = 23;
      const theta = 2.0 * Math.PI / num2 * this.rotCount;
      this.rotCount = (this.rotCount + 1) % num2;
      const b = setBullet(now,[this.x+r2*Math.sin(theta),this.y-r2*aspect*Math.cos(theta),0.0,theta],10.0);
      globalBullets.instance[0].push(b);
      objData.soundPlayer.playEffect();
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
  collisionDetect(objData){
    const shots = objData.shots;
    const modelViewMatrix = objData.modelViewMatrix;

    const cpos = this.charPos();
    const posMe = [cpos[0],cpos[1]];

    const primitive = shots.primitive;

    let straightArray = this.colDetSub(shots.straight,primitive,modelViewMatrix);
    let trackingArray = this.colDetSub(shots.tracking,primitive,modelViewMatrix);
    return {
      straight: straightArray,
      tracking: trackingArray,
    };
  }
  colDetSub(shotInstance,primitive,modelViewMatrix){
    let delIdxArray = [];

    const cpos = this.charPos();
    const posMe = [cpos[0],cpos[1]];
    for(let i = 0; i < shotInstance.length; i++){
      const spos = shotInstance[i].pos;
      const posShotCenter = [spos[0],spos[1]];
      const theta = spos[2];

      if(distance(posMe,posShotCenter) > modelViewMatrix[0] * (this.size+primitive.size)){
        continue;
      }
      const vnum = primitive.outer.length;
      const posArray = getModifiedPrimitivePos(primitive,theta,modelViewMatrix);
      const posM = [posMe[0]-posShotCenter[0],posMe[1]-posShotCenter[1]];
      if(isInner(vnum,posArray,posM) || (isTouched(vnum,posArray,posM,modelViewMatrix[0]*this.size))){
        delIdxArray.push(i);
      }
    }
    return delIdxArray;
  }
}

////////////////////////////
/// me
////////////////////////////
class ShotGenerator{
  constructor(x,y){
    this.relX = x; // relative position to me
    this.relY = y;
    this.interval = 0.1;
    this.prevShot = -100.0;
  }
  generateShot(now,mePos,shots){
    if(now - this.prevShot < this.interval){
      return;
    }
    this.prevShot = now;
    const data = {
      start: now,
      pos: [mePos[0]+this.relX,mePos[1]+this.relY,0.0], // x,y,theta
      lifetime: 5.0,
    };
    const data2 = {
      start: now,
      pos: [mePos[0]+this.relX,mePos[1]+this.relY,0.0], // x,y,theta
      lifetime: 5.0,
    };
    shots.straight.push(data);
    shots.tracking.push(data2);
  }
}
class Shots{
  constructor(gl){
    this.straight = [];
    this.tracking = [];
    this.speed = 0.01;

    this.primitive = getShot();
    this.buffers = initBuffers(gl,this.primitive);
    const vsSource2 = vsCode2();
    const fsSource = fsCode();
    this.shader = initShaderProgram(gl,vsSource2,fsSource);
    this.attribL = initVs2AttribL(gl,this.shader);
    this.uniformL = initVs2UniformL(gl,this.shader);
  }
  updatePosition(now,enemies){
    // TODO delete if lifetimeover or collision to enemies
    this.garbageCollection(now);
    //
    for(let i = 0; i < this.straight.length; i++){
      this.straight[i].pos[1] += this.speed;
    }
    for(let i = 0; i < this.tracking.length; i++){
      let myPos = this.tracking[i].pos;
      let ePos = this.findNearEnemy(myPos,enemies);
      let dir = [ePos[0] - myPos[0],ePos[1] - myPos[1]];
      let r = norm(dir);
      let normDir = [dir[0]/r,dir[1]/r];
      myPos[0] += normDir[0] * this.speed;
      myPos[1] += normDir[1] * this.speed;
      const asinv = Math.asin(normDir[0]);
      const sgn = asinv >= 0.0 ? 1.0 : -1.0;
      myPos[2] = normDir[1] <= 0.0 ? asinv : Math.PI - asinv;
    }
  }
  garbageCollection(now){
    for(let i = 0; i < this.straight.length; i++){
      if(this.straight[i].lifetime < now - this.straight[i].start){
        this.straight.splice(0,i);
      }
    }
    for(let i = 0; i < this.tracking.length; i++){
      if(this.tracking[i].lifetime < now - this.tracking[i].start){
        this.tracking.splice(0,i);
      }
    }
  }
	deleteByIdxArray(idxArray){
		for(let i = idxArray.straight.length-1; i>=0; i--){
			this.straight.splice(idxArray.straight[i],1);
		}
		for(let i = idxArray.tracking.length-1; i>=0; i--){
			this.tracking.splice(idxArray.tracking[i],1);
		}
	}
  findNearEnemy(pos,enemies){
    let minDist = 10000.0;
    let minPos = [pos[0],pos[1]-10000.0];
    for(let i = 0; i < enemies.length; i++){
      let ePos3 = enemies[i].charPos();
      let ePos = [ePos3[0],ePos3[1]];
      let dist = distance(pos,ePos);
      if(dist < minDist){
        minDist = dist;
        minPos = ePos;
      }
    }
    return minPos;
  }
  draw(gl,modelViewMatrix,elasped){
    gl.useProgram(this.shader);
    enableBuffers(gl,this.attribL,this.uniformL,this.buffers);
    setUniformModelViewMatrix(gl,modelViewMatrix,this.uniformL);
    gl.uniform1f(this.uniformL.elasped,elasped);
    for(let i = 0; i < this.straight.length; i++){
      const parallelMatrix = getParallelMatrix(this.straight[i].pos);
      const rotationMatrix = getRotationMatrix(this.straight[i].pos[2]);
      setUniformParallelMatrix(gl,parallelMatrix,this.uniformL);
      setUniformRotationMatrix(gl,rotationMatrix,this.uniformL);
      gl.drawElements(gl.TRIANGLES,this.buffers.length,gl.UNSIGNED_SHORT,0);
    }
    for(let i = 0; i < this.tracking.length; i++){
      const parallelMatrix = getParallelMatrix(this.tracking[i].pos);
      const rotationMatrix = getRotationMatrix(this.tracking[i].pos[2]);
      setUniformParallelMatrix(gl,parallelMatrix,this.uniformL);
      setUniformRotationMatrix(gl,rotationMatrix,this.uniformL);
      gl.drawElements(gl.TRIANGLES,this.buffers.length,gl.UNSIGNED_SHORT,0);
    }
  }
}
class Me{
  constructor(gl,x,y,r){
    this.r = r;
    this.x = x;
    this.y = y;
    this.core = getCore(r);
    this.buffers = initBuffers(gl,this.core);
    const vsSource2 = vsCode2();
    const fsSource = fsCode();
    this.shader = initShaderProgram(gl,vsSource2,fsSource);
    this.attribL = initVs2AttribL(gl,this.shader);
    this.uniformL = initVs2UniformL(gl,this.shader);

    this.move = moveConstantVelocity(0.0,[0.0,0.0]);
    this.transparent = 1.0;

    this.shotSpeed = 0.2;
    this.shotGenerators = [new ShotGenerator(0.0,0.05)];
  }
  pos(){
    return [this.x,this.y,0.0]; // x,y,theta
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
    for(let i = 0; i < this.shotGenerators.length; i++){
      this.shotGenerators[i].generateShot(now,this.pos(),shots);
    }
  }
  draw(gl,modelViewMatrix){
    const parallelMatrix = getParallelMatrix(this.pos());
		const rotationMatrix = getRotationMatrix(0.0);
    gl.useProgram(this.shader);
    enableBuffers(gl,this.attribL,this.uniformL,this.buffers);
    setUniformModelViewMatrix(gl,modelViewMatrix,this.uniformL);
    setUniformParallelMatrix(gl,parallelMatrix,this.uniformL);
		setUniformRotationMatrix(gl,rotationMatrix,this.uniformL);
    gl.drawElements(gl.TRIANGLES,this.buffers.length,gl.UNSIGNED_SHORT,0);
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
