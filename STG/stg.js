
// TODO 処理が重いようならQueueを使うなりして削除のコストを下げるべし
function bulletsGC(bullets,now){
	for(let i = 0; i < bullets.length; i++){
		for(let j = 0; j < bullets[i].length; j++){
			if(bullets[i][j].lifetime < now - bullets[i][j].start){
				bullets[i].splice(0,j);
			}
		}
	}
}

function initPrimitiveBuffers(gl,arrays){
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arrays.position),gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arrays.color),gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(arrays.index),gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		index: indexBuffer,
		length: arrays.index.length,
	};
}
function enablePrimitiveBuffers(gl,attribL,uniformL,primitiveBuffers){
	gl.bindBuffer(gl.ARRAY_BUFFER,primitiveBuffers.position);
	gl.vertexAttribPointer(attribL.vertexPosition,3,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER,primitiveBuffers.color);
	gl.vertexAttribPointer(attribL.vertexColor,4,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexColor);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,primitiveBuffers.index);
}

function setUniformModelViewMatrix(gl,modelViewMatrix,uniformL){
	gl.uniformMatrix4fv(uniformL.modelViewMatrix,false,modelViewMatrix);
}
function setUniformParallelMatrix(gl,parallelMatrix,uniformL){
	gl.uniformMatrix4fv(uniformL.parallelMatrix,false,parallelMatrix);
}

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

function setUniformMoveB(gl,programInfo,move){
	gl.uniform3fv(programInfo.uniformLocationsB.time,move.time);
	gl.uniform2fv(programInfo.uniformLocationsB.v1,move.v1);
	gl.uniform2fv(programInfo.uniformLocationsB.a1,move.a1);
	gl.uniform1f(programInfo.uniformLocationsB.vStopRot,move.vStopRot);
	gl.uniform2fv(programInfo.uniformLocationsB.v2,move.v2);
	gl.uniform2fv(programInfo.uniformLocationsB.a2,move.a2);
}
function setUniformBullet(gl,programInfo,bullet){
	gl.uniform1f(programInfo.uniformLocationsB.start,bullet.start);
	gl.uniform4fv(programInfo.uniformLocationsB.x0,bullet.x0);
}

function drawSceneSTG(gl,programInfo,modelViewMatrix,primitivesBuffers,moves,bullets,me,elasped){
	gl.clearColor(0.0,0.0,0.0,1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// draw bullets

	gl.useProgram(programInfo.bulletProgram);
	setUniformModelViewMatrix(gl,modelViewMatrix,programInfo.uniformLocationsB);
	gl.uniform1f(programInfo.uniformLocationsB.elasped,elasped);
	for(let i = 0; i < bullets.length; i++){
		enablePrimitiveBuffers(gl,programInfo.attribLocationsB,programInfo.uniformLocationsB,primitivesBuffers[i]);
		setUniformMoveB(gl,programInfo,moves[i]);
		for(let j = 0; j < bullets[i].length; j++){
			setUniformBullet(gl,programInfo,bullets[i][j]);
			gl.drawElements(gl.TRIANGLES,primitivesBuffers[i].length,gl.UNSIGNED_SHORT,0);
		}
	}

	// draw me
	let meParallelMatrix = getParallelMatrix(me.pos()); //TODO
	gl.useProgram(programInfo.meProgram);
	enablePrimitiveBuffers(gl,programInfo.attribLocationsM,programInfo.uniformLocationsM,me.buffers);
	setUniformModelViewMatrix(gl,modelViewMatrix,programInfo.uniformLocationsM);
	setUniformParallelMatrix(gl,meParallelMatrix,programInfo.uniformLocationsM);
	gl.drawElements(gl.TRIANGLES,me.buffers.length,gl.UNSIGNED_SHORT,0);
}

function collisionDetection(me,primitivesData,moves,bullets,modelViewMatrix,elasped){
	const posMe = me.pos();

	//for all bullets
	for(let i = 0; i < bullets.length; i++){
		const primitive = primitivesData[i];
		const move = moves[i];
		for(let j = 0; j < bullets[i].length; j++){

			const bullet = bullets[i][j];
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
			// is near enough to check in detail?
			/*
			if(dist(posMe,posBulletCenter) > modelViewMatrix[0] * (me.r+primitive.size)){
				continue;
			}
			*/
			// calculate outer vertex position(relative to center pos)
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
			let posM = [posMe[0]-posBulletCenter[0],posMe[1]-posBulletCenter[1]];
			// compare posArray and posM(not PosMe!)
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
				if(distFromAB < modelViewMatrix[0] * me.r){
					return true;
				}
			}
			if(innerCheck){
				return true;
			}
		}
	}
	return false;
}

function dist(p1,p2){
	const x = p1[0]-p2[0];
	const y = p1[1]-p2[1];
	return Math.sqrt(x*x + y*y);
}
function norm(vec){
	return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1]);
}

function crossProduct(p1,p2){
	return p1[0]*p2[1] - p1[1]*p2[0];
}
function dotProduct(p1,p2){
	return p1[0]*p2[0] + p1[1]*p2[1];
}
