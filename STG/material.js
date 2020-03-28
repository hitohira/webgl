// generation
/*
 * float aStopTime; 初期停止時間の終わる時刻
 * float alifeTime: 自身が消える時刻
 * vec2 aV; 自身の向き方向に対する初期速度v,ω
 * vec2 aA; 自身の向き方向に対する加速度a,γ
 * [[moveIndex,theta],[...],...] next: 自身が消えた後に発生するもの
 */
function moveRaw(stopTime,lifeTime,v,a,next){
	return {
		stopTime: stopTime,
		lifeTime: lifeTime,
		v: v,
		a: a,
		next: next,
	};
}
function moveConstantVelocity(t0,v){
	return {
		stopTime: t0,
		lifeTime: 10.0,
		v: v,
		a: [0.0,0,0],
		next: [],
	};
}
function moveConstantAcceleration(t0,v,a){
	return {
		stopTime: t0,
		lifeTime: 10.0,
		v: v,
		a: a,
		next: [],
	};
}

// x0 - [x,y,theta]
function setBullet(start,x0){
	return {
		start: start,
		pos: x0,
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
