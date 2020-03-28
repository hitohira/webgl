main();


function main(){
	let gl = initCanvas();

	// set primitive list of bullets
	const triangle = getTriangle();
	const rect = getRectangle(2.0,2.0);
	const triangleBuffers = initBuffers(gl,triangle);
	const rectangleBuffers = initBuffers(gl,rect);
	let primitivesBuffers = [rectangleBuffers,triangleBuffers,triangleBuffers];
	let primitivesData = [rect,triangle,triangle];

	// set movement list of bullets
	const move0 = moveConstantAcceleration(0.8,[0.0,0.0],[0.15,0]);
	const move1 = moveConstantVelocity(0.3,[0.25,0]);
	const move2 = moveRaw([0.3,1.4,1.6],[0.25,0],[0.0,0.0],Math.PI,[0.1,0.0],[0.15,0.0]);
	let moves = [move0,move1,move2];

	let bullets = new Bullets(gl,primitivesData,primitivesBuffers,moves);
	let shots = new Shots(gl);

	let then = 0.0;

	let me = new Me(gl,0.0,-0.4,0.6);
	let inputs = new Inputs();
	addUIEvent(me,inputs);
	let witch = new Witch(gl,0.0,0.5,then);
	let enemies = [witch];

	let modelViewMatrix = getModelViewMatrix(gl);

	const soundPlayer = new SoundPlayer();

	let objData = {
		bullets: bullets,
		shots: shots,
		me: me,
		enemies: enemies,
		modelViewMatrix: modelViewMatrix,
		soundPlayer: soundPlayer,
	};


	let state = 0; // 0: wait, 1:shooting, 2:gameover
	function render(now){
		now *= 0.001;
		then = now;

		shots.updatePosition(now,enemies);
		bullets.garbageCollection(now);
		witch.generateBullets(gl,now,objData);

		// TODO hit damege to witch and something
		const collisionIdxArray = witch.collisionDetect(objData);
		shots.deleteByIdxArray(collisionIdxArray);

		inputs.update(me);
		if(inputs.shot){
			me.shot(now,shots);
		}

		drawSceneSTG(gl,objData,now);
		let isDetected = me.collisionDetected(objData,now);
		if(isDetected){
			state = 2;
			soundPlayer.stopBGM();
			drawTalk("魔女","ゲームオーバーだよ☆<br>");
		//	clearText();
		}
		else{
			requestAnimationFrame(render);
		}
	}
	document.addEventListener('keyup', (event) => {
		state = 1;
		soundPlayer.startBGM();
		requestAnimationFrame(render);
	},{once: true});
}
