// generation
/*
 * vec3 aTime; 初期停止時間の終わる時刻、第一運動時間の終わる時刻、一時停止時間の終わる時刻
 * vec4 aX0; 初期位置x,y,z,θ
 * vec2 aV1; 自身の向き方向に対する初期速度v,ω
 * vec2 aA1; 自身の向き方向に対する加速度a,γ
 * float aVStopRot; 一時停止中の角速度
 * vec2 aV2; 一時停止後の初期速度
 * vec2 aA2; 一時停止後の加速度
 */
function moveRaw(time,v1,a1,vStopRot,v2,a2){
	return {
		time: time,
		v1: v1,
		a1: a1,
		vStopRot: vStopRot,
		v2: v2,
		a2: a2,
	};
}
function moveConstantVelocity(t0,v1){
	return {
		time: [t0, t0, t0,],
		v1: [0.0,0.0],
		a1: [0.0,0.0],
		vStopRot: 0.0,
		v2: v1,
		a2: [0.0,0.0],
	};
}
function moveConstantAcceleration(t0,v1,a1){
	return {
		time: [t0, t0, t0,],
		v1: [0.0,0.0],
		a1: [0.0,0.0],
		vStopRot: 0.0,
		v2: v1,
		a2: a1,
	};
}
function moveConstantVelocityW(time,v1,vStopRot,v2){
	return {
		time: time,
		v1: v1,
		a1: a1,
		vStopRot: vStopRot,
		v2: v2,
		a2: [0.0,0.0],
	};
}

// x0 - [x,y,theta]
function setBullet(start,x0,lifetime){
	return {
		start: start,
		pos: x0,
		lifetime: lifetime,
	};
}
// primitive
// position : vertex position(vec3)
// color : vertex color(vec4)
// index : for drawElements
// outer : for collision detection, outer vertex
// size : circle whose radius is "size" contains this primitive
function getRectangle(width,height){
	let w = width / 2.0;
	let h = height / 2.0;
	return {
		position: [
			-w*0.8, h*0.8, 0.0,
			-w*0.8,-h*0.8, 0.0,
			 w*0.8,-h*0.8, 0.0,
			 w*0.8, h*0.8, 0.0,
			-w, h, 0.0,
			-w, 0.0, 0.0,
			-w,-h, 0.0,
			 0.0,-h, 0.0,
			 w,-h, 0.0,
			 w, 0.0, 0.0,
			 w, h, 0.0,
			 0.0, h, 0.0,
		],
		color: [
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
			0.0,0.0,1.0,1.0,
		],
		index: [
			0,1,2,
			2,3,0,
			0,4,5,
			0,5,1,
			5,6,1,
			1,6,7,
			1,7,2,
			7,8,2,
			2,8,9,
			2,9,3,
			9,10,3,
			3,10,11,
			3,11,0,
			11,4,0,
		],
		outer: [ // for collision detection
			4,6,8,10,
		],
		size: 1.5,
	};
}

function getTriangle(){
	return {
		position: [
			-0.8, 0.8, 0.0,
			 0.0,-0.8, 0.0,
			 0.8, 0.8, 0.0,
			-1.0, 1.0, 0.0,
			-0.5, 0.0, 0.0,
			 0.0,-1.0, 0.0,
			 0.5, 0.0, 0.0,
			 1.0, 1.0, 0.0,
			 0.0, 1.0, 0.0,
		],
		color: [
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			0.0,1.0,0.0,1.0,
			0.0,1.0,0.0,1.0,
			0.0,1.0,0.0,1.0,
			0.0,1.0,0.0,1.0,
			0.0,1.0,0.0,1.0,
			0.0,1.0,0.0,1.0,
		],
		index: [
			0,1,2,
			0,3,4,
			0,4,1,
			4,5,1,
			1,5,6,
			1,6,2,
			6,7,2,
			2,7,8,
			2,8,0,
			8,0,3,
		],
		outer: [
			3,5,7,
		],
		size: 1.5,
	};
}

// core of me, circle
function getCore(r){
	const num = 20;
	let pos = [0.0,0.0,0.0];
	let color = [1.0,1.0,1.0,1.0];
	let idx = [];
	for(let i = 0; i < num; i++){
		const theta = 2.0 * Math.PI / num * i;
		pos.push(r*Math.sin(theta));
		pos.push(r*Math.cos(theta));
		pos.push(0.0);
	 	Array.prototype.push.apply(color,[1.0,0.4,0.4,1.0]);
		idx.push(0);
		idx.push(i+1);
		idx.push((i+1)%num+1);
	}
	return {
		position: pos,
		color: color,
		index: idx,
	}
}

function getShot(){
	let w = 0.5;
	let h = 1.0;
	return {
		position: [
			-w*0.5, h*0.5, 0.0,
			-w*0.5,-h*0.5, 0.0,
			 w*0.5,-h*0.5, 0.0,
			 w*0.5, h*0.5, 0.0,
			-w, h, 0.0,
			-w, 0.0, 0.0,
			-w,-h, 0.0,
			 0.0,-h, 0.0,
			 w,-h, 0.0,
			 w, 0.0, 0.0,
			 w, h, 0.0,
			 0.0, h, 0.0,
		],
		color: [
			1.0,1.0,1.0,0.5,
			1.0,1.0,1.0,0.5,
			1.0,1.0,1.0,0.5,
			1.0,1.0,1.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
			1.0,0.0,0.0,0.5,
		],
		index: [
			0,1,2,
			2,3,0,
			0,4,5,
			0,5,1,
			5,6,1,
			1,6,7,
			1,7,2,
			7,8,2,
			2,8,9,
			2,9,3,
			9,10,3,
			3,10,11,
			3,11,0,
			11,4,0,
		],
		outer: [ // for collision detection
			4,6,8,10,
		],
		size: 1.5,
	};
}
