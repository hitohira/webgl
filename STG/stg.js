
function getModelViewMatrix(gl){
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const magnif = 0.03;
	return [
	magnif,           0.0,    0.0, 0.0,
	   0.0, magnif*aspect,    0.0, 0.0,
	   0.0,           0.0, magnif, 0.0,
	   0.0,           0.0,    0.0, 1.0,
	];
}
function getParallelMatrix(pos){
	return [
		    1.0,    0.0, 0.0, 0.0,
		    0.0,    1.0, 0.0, 0.0,
		    0.0,    0.0, 1.0, 0.0,
		 pos[0], pos[1], 0.0, 1.0,
	];
}
function getRotationMatrix(theta){
	return [
		 Math.cos(theta), Math.sin(theta), 0.0, 0.0,
		-Math.sin(theta), Math.cos(theta), 0.0, 0.0,
					      	0.0,            0.0, 1.0, 0.0,
				      		0.0,            0.0, 0.0, 1.0
	];
}
function setUniformMoveB(gl,uniformL,move){
	gl.uniform3fv(uniformL.time,move.time);
	gl.uniform2fv(uniformL.v1,move.v1);
	gl.uniform2fv(uniformL.a1,move.a1);
	gl.uniform1f(uniformL.vStopRot,move.vStopRot);
	gl.uniform2fv(uniformL.v2,move.v2);
	gl.uniform2fv(uniformL.a2,move.a2);
}
function setUniformBullet(gl,uniformL,bullet){
	gl.uniform1f(uniformL.start,bullet.start);
	gl.uniform4fv(uniformL.x0,bullet.x0);
}

function drawSceneSTG(gl,objData,elasped){
	const bullets = objData.bullets;
	const me = objData.me;
	const enemies = objData.enemies;
	const shots = objData.shots;
	const modelViewMatrix = objData.modelViewMatrix;

	gl.clearColor(0.0,0.0,0.0,1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	// gl.disable(gl.BLEND);

	bullets.draw(gl,modelViewMatrix,elasped);
	shots.draw(gl,modelViewMatrix,elasped);
	me.draw(gl,modelViewMatrix);

	for(let i = 0; i < enemies.length; i++){
		const enemy = enemies[i];
		enemies[i].draw(gl,modelViewMatrix);
	}
}

function getBulletCenterInfo(move,instance,elasped){
	const bullet = instance;
	const existing_time = elasped - bullet.start;
	const time = move.time;

	// calculate the central position of a bullet
	let posBulletCenter = [bullet.x0[0],bullet.x0[1]];
	let theta = bullet.x0[3];
	if(existing_time > time[0]){
		const dt = existing_time > time[1] ? time[1] - time[0] : existing_time - time[1];
		theta += move.v1[1]*dt + 0.5*move.a1[1]*dt*dt;
		const r = move.v1[0] + 0.5*move.a1[0]*dt;
		posBulletCenter[0] +=  r * Math.sin(theta) * dt;
		posBulletCenter[1] += -r * Math.cos(theta) * dt;
	}
	if(existing_time > time[2]){
		const dt = existing_time - time[2];
		theta += move.v2[1]*dt + 0.5*move.a2[1]*dt*dt;
		const r = move.v2[0] + 0.5*move.a2[0]*dt;
		posBulletCenter[0] +=  r * Math.sin(theta) * dt;
		posBulletCenter[1] += -r * Math.cos(theta) * dt;
	}
	return {
		center: posBulletCenter,
		theta: theta,
	};
}
function getModifiedPrimitivePos(primitive,theta,modelViewMatrix){
	let posArray = [];
	const vnum = primitive.outer.length;
	for(let k = 0; k < vnum; k++){
		const idx = primitive.outer[k];
		let posX = primitive.position[idx*3];
		let posY = primitive.position[idx*3+1];
		let rotedX = posX * Math.cos(theta) + posY * -Math.sin(theta);
		let rotedY = posX * Math.sin(theta) + posY * Math.cos(theta);
		let magnifedX = rotedX * modelViewMatrix[0];
		let magnifedY = rotedY * modelViewMatrix[5];
		posArray.push([magnifedX,magnifedY]);
	}
	posArray.push(posArray[0]);
	return posArray;
}
function isInner(vnum,posArray,posRelative){
	const posM = posRelative;
	let innerCheck = true;
	for(let k = 1; k <= vnum; k++){ // do for each line segment
		const posA = posArray[k-1];
		const posB = posArray[k];
	// if center of me is inner, crossProduct >= 0 for all segment.
		const vecAB = [posB[0]-posA[0], posB[1]-posA[1]];
		const vecAM = [posM[0]-posA[0], posM[1]-posA[1]];
		const vecBM = [posM[0]-posB[0], posM[1]-posB[1]];
		if(crossProduct(vecAB,vecAM) < 0.0){
			innerCheck = false;
		}
	}
	return innerCheck;
}
function isTouched(vnum,posArray,posRelative,radius){
	const posM = posRelative;
	for(let k = 1; k <= vnum; k++){ // do for each line segment
		const posA = posArray[k-1];
		const posB = posArray[k];
	// if center of me is inner, crossProduct >= 0 for all segment.
		const vecAB = [posB[0]-posA[0], posB[1]-posA[1]];
		const vecAM = [posM[0]-posA[0], posM[1]-posA[1]];
		const vecBM = [posM[0]-posB[0], posM[1]-posB[1]];
	// if me and segment intersect, dist(me,segment) < me.r
		const lenAM = norm(vecAM);
		const lenAB = norm(vecAB);
		const lenBM = norm(vecBM);
		const lenProj = dotProduct(vecAM,vecAB) / lenAB;
		// check location rel to A
		const cosBAM = dotProduct(vecAB,vecAM) / (lenAM * lenAB);
		// check location rel to B
		const cosApBM = dotProduct(vecAB,vecBM) / (lenBM * lenAB);
		let distFromAB = 0.0;
		if(cosBAM < 0.0){ // near point A
			distFromAB = norm(vecAM);
		}
		else if(cosApBM > 0.0){ // near point B
			distFromAB = norm(vecBM);
		}
		else{ // near line AB
			distFromAB = Math.sqrt(lenAM*lenAM - lenProj*lenProj);
		}
		if(distFromAB < radius){
			return true;
		}
	}
}
