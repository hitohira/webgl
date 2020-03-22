/* aTime = [初期停止時間の終わる時刻、第一運動時間の終わる時刻、一時停止時間の終わる時刻]
 * aX0 初期位置x,y,z,θ
 * aV1 自身の向き方向に対する初期速度v,ω
 * aA1 自身の向き方向に対する加速度a,γ
 * aVStopRot 一時停止中の角速度
 * aV2,aA2 一時停止後の初期速度加速度
 mat4はtransposedされているような配置になっているので注意(see parallelMatrix)
 */
function vsCode(){
	return `
		attribute vec3 aVertexPosition;
		attribute vec4 aVertexColor;

		uniform float uStart;
		uniform vec3 uTime;
		uniform vec4 uX0;
		uniform vec2 uV1;
		uniform vec2 uA1;
		uniform float uVStopRot;
		uniform vec2 uV2;
		uniform vec2 uA2;

		uniform mat4 uModelViewMatrix;
		uniform float uElasped;

		varying lowp vec4 vColor;

		vec4 interPosition;
		float dt;

		void main(){
			float existing_time = uElasped - uStart;
			interPosition = vec4(aVertexPosition,1.0);
			float theta = uX0[3];

			mat4 parallelMatrix = mat4(
				   1.0,   0.0,   0.0, 0.0,
				   0.0,   1.0,   0.0, 0.0,
				   0.0,   0.0,   1.0, 0.0,
				uX0[0],uX0[1],uX0[2], 1.0
			);

			if(existing_time > uTime[0]){
				dt = existing_time > uTime[1] ? uTime[1] - uTime[0] : existing_time - uTime[1];
				theta += uV1[1]*dt + 0.5*uA1[1]*dt*dt;
				float r = uV1[0] + 0.5*uA1[0]*dt;
				parallelMatrix[3][0] +=  r * sin(theta) * dt;
				parallelMatrix[3][1] += -r * cos(theta) * dt;

			}
			if(existing_time > uTime[1]){

			}
			if(existing_time > uTime[2]){
				dt = existing_time - uTime[2];
				theta += uV2[1]*dt + 0.5*uA2[1]*dt*dt;
				float r = uV2[0] + 0.5*uA2[0]*dt;
				parallelMatrix[3][0] +=  r * sin(theta) * dt;
				parallelMatrix[3][1] += -r * cos(theta) * dt;
			}
			mat4 RotationMatrix = mat4(
				 cos(theta), sin(theta), 0.0, 0.0,
				-sin(theta), cos(theta), 0.0, 0.0,
				         0.0,         0.0, 1.0, 0.0,
				         0.0,         0.0, 0.0, 1.0
			);

			gl_Position = parallelMatrix * uModelViewMatrix * RotationMatrix * interPosition;
			vColor = aVertexColor;
		}
	`;
}
function vsCode2(){
	return `
		attribute vec3 aVertexPosition;
		attribute vec4 aVertexColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uParallelMatrix;

		varying lowp vec4 vColor;

		void main(){
			vec4 interPosition = vec4(aVertexPosition,1.0);
			gl_Position = uParallelMatrix * uModelViewMatrix * interPosition;
			vColor = aVertexColor;
		}
	`;
}
function fsCode(){
	return `
		varying lowp vec4 vColor;

		void main(){
			gl_FragColor = vColor;
		}
	`;
}

function initCanvas(){
	const canvas = document.querySelector("#glcanvas");
	var gl = canvas.getContext("webgl");
	if(!gl){
		alert("may not support WebGL");
	}
	return gl;
}

function initShaderProgram(gl,vsSource,fsSource){
	var vs = loadShader(gl,gl.VERTEX_SHADER,vsSource);
	var fs = loadShader(gl,gl.FRAGMENT_SHADER,fsSource);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram,vs);
	gl.attachShader(shaderProgram,fs);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)){
		alert("fail at initiarizing shader program");
	}

	return shaderProgram;
}

function loadShader(gl,type,source){
	const shader = gl.createShader(type);
	gl.shaderSource(shader,source);

	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
		alert("fail at compiling shader: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}
