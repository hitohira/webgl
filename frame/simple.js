
function main(){
	var gl = initCanvas(); // init gl
	const vsSource = vsCode();
	const fsSource = fsCode();
	const shaderProgram = initShaderProgram(gl,vsSource,fsSource); // init shaderProgram
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram,"aVertexPosition"),
			vertexColor : gl.getAttribLocation(shaderProgram,"aVertexColor"),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram,"uProjectionMatrix"),
			modelViewMatrix:  gl.getUniformLocation(shaderProgram,"uModelViewMatrix"),
		},
	};
	const buffers = initBuffers(gl);

	drawScene(gl,programInfo,buffers);

}

function vsCode(){
	return `
		attribute vec4 aVertexPosition;
		attribute vec4 aVertexColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		varying lowp vec4 vColor;
		
		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
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

function drawScene(gl,programInfo,buffers){
	gl.clearColor(0.0,0.0,0.0,1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fieldOfView = 45 * Math.PI / 180;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
	                 fieldOfView,
									 aspect,
									 zNear,
									 zFar);
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,
	               modelViewMatrix,
								 [-0.,0.0,-6.0]);
	{	
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		//position
		gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
		                       numComponents,
													 type,
													 normalize,
													 stride,
													 offset);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);	
	}
	{
		const numComponents = 4;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		//color
		gl.bindBuffer(gl.ARRAY_BUFFER,buffers.color);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
		                       numComponents,
													 type,
													 normalize,
													 stride,
													 offset);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);	

	}
	gl.useProgram(programInfo.program);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix);
	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP,offset,vertexCount);
	}
}

function initBuffers(gl){
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);

	const positions = [
		1.0 ,1.0 ,0.0,
		-1.0 ,1.0 ,0.0,
		1.0 ,-1.0 ,0.0,
		-1.0 ,-1.0 ,0.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
	
	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);

	const colors = [
		1.0,1.0,1.0,1.0,
		1.0,0.0,0.0,1.0,
		0.0,1.0,0.0,1.0,
		0.0,0.0,1.0,1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);

	return {
		position : positionBuffer,
		color : colorBuffer,
	};
}


////////////////////////////////////////////////////////////////////////

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
// idが`id`である<script>からシェーダプログラムを取ってくる
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

