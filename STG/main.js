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

	// set shape list of bullets
	const triangle = getTriangle();
	const rect = getRectangle();
	const triangleBuffers = initPrimitiveBuffers(gl,triangle);
	const rectangleBuffers = initPrimitiveBuffers(gl,rect);
	let primitivesBuffers = [rectangleBuffers,triangleBuffers];
	let primitivesData = [rect,triangle];

	// set movement list of bullets
	const move0 = moveConstantVelocity(0.3,[0.25,0]);
	const move1 = moveConstantAcceleration(0.8,[0.0,0.0],[0.15,0]);
	let moves = [move1,move0];

	let bullets = [[],[]];

	let timerGC = 0.0;
	let then = 0.0;

	let me = new Me(gl,0.0,-0.4,0.6);
	let inputs = new Inputs();
	addUIEvent(me,inputs);
	let witch = new Witch(0.0,0.5,then);

	let modelViewMatrix = getModelViewMatrix(gl);
	let state = 0; // 0:shooting, 1:gameover
	function render(now){
		now *= 0.001;
		then = now;

		witch.generateBullets(gl,now,bullets);

		inputs.update(me);

		if(now - timerGC > 1.0){
			bulletsGC(bullets,now);
			timerGC = now;
		}
		drawSceneSTG(gl,programInfo,modelViewMatrix,primitivesBuffers,moves,bullets,me,now);
		let isDetected = collisionDetection(me,primitivesData,moves,bullets,modelViewMatrix,now);
		if(isDetected){
			state = 1;
			drawText("GAME OVER");
		}
		else{
			requestAnimationFrame(render);
		}
	}

	requestAnimationFrame(render);
}

function drawText(str){
	const div = document.getElementById("text");
	div.innerHTML = str;
}
