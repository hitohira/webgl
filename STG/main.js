main();


function main(){
	let gl = initCanvas();

	const vsSource = vsCode();
	const vsSource2 = vsCode2();
	const fsSource = fsCode();
	const bulletShaderProgram = initShaderProgram(gl,vsSource,fsSource);
	const meShaderProgram = initShaderProgram(gl,vsSource2,fsSource);
	const programInfo = {
		bulletProgram: bulletShaderProgram,
		attribLocationsB: {
			vertexPosition : gl.getAttribLocation(bulletShaderProgram,"aVertexPosition"),
			vertexColor: gl.getAttribLocation(bulletShaderProgram,"aVertexColor"),
		},
		uniformLocationsB: {
			modelViewMatrix : gl.getUniformLocation(bulletShaderProgram,"uModelViewMatrix"),
			elasped: gl.getUniformLocation(bulletShaderProgram,"uElasped"),
			start: gl.getUniformLocation(bulletShaderProgram,"uStart"),
			time: gl.getUniformLocation(bulletShaderProgram,"uTime"),
			x0: gl.getUniformLocation(bulletShaderProgram,"uX0"),
			v1: gl.getUniformLocation(bulletShaderProgram,"uV1"),
			a1: gl.getUniformLocation(bulletShaderProgram,"uA1"),
			vStopRot: gl.getUniformLocation(bulletShaderProgram,"uVStopRot"),
			v2: gl.getUniformLocation(bulletShaderProgram,"uV2"),
			a2: gl.getUniformLocation(bulletShaderProgram,"uA2"),
		},
		meProgram: meShaderProgram,
		attribLocationsM: {
			vertexPosition : gl.getAttribLocation(meShaderProgram,"aVertexPosition"),
			vertexColor: gl.getAttribLocation(meShaderProgram,"aVertexColor"),
		},
		uniformLocationsM: {
			modelViewMatrix: gl.getUniformLocation(meShaderProgram,"uModelViewMatrix"),
			parallelMatrix: gl.getUniformLocation(meShaderProgram,"uParallelMatrix"),
		},
	};

	// set primitive list of bullets
	const triangle = getTriangle();
	const rect = getRectangle(2.0,2.0);
	const triangleBuffers = initBuffers(gl,triangle);
	const rectangleBuffers = initBuffers(gl,rect);
	let primitivesBuffers = [rectangleBuffers,triangleBuffers];
	let primitivesData = [rect,triangle];

	// set movement list of bullets
	const move0 = moveConstantVelocity(0.3,[0.25,0]);
	const move1 = moveConstantAcceleration(0.8,[0.0,0.0],[0.15,0]);
	let moves = [move1,move0];

	let bullets = new Bullets(primitivesData,primitivesBuffers,moves);
	let shots = new Shots();

	let then = 0.0;

	let me = new Me(gl,0.0,-0.4,0.6);
	let inputs = new Inputs();
	addUIEvent(me,inputs);
	let witch = new Witch(gl,0.0,0.5,then);
	let enemies = [witch];

	let modelViewMatrix = getModelViewMatrix(gl);

	let objData = {
		bullets: bullets,
		shots: shots,
		me: me,
		enemies: enemies,
		modelViewMatrix: modelViewMatrix,
	};

	let state = 0; // 0:shooting, 1:gameover
	function render(now){
		now *= 0.001;
		then = now;

		bullets.garbageCollection(now);
		witch.generateBullets(gl,now,bullets);
		inputs.update(me);
		if(inputs.shot){
			me.shot(now,shots);
		}

		drawSceneSTG(gl,programInfo,objData,now);
		let isDetected = collisionDetection(objData,now);
		if(isDetected){
			state = 1;
			drawTalk("魔女","ゲームオーバーですよー<br>もっと真面目にやれー");
		//	clearText();
		}
		else{
			requestAnimationFrame(render);
		}
	}

	requestAnimationFrame(render);
}
