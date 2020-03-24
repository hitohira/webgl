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

function initBuffers(gl,arrays){
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
function initBuffersTex(gl,arrays){
	let bufs = initBuffers(gl,arrays);
	const texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arrays.textureCoord),gl.STATIC_DRAW);
	return {
		position: bufs.position,
		color: bufs.color,
		index: bufs.index,
		textureCoord: texBuffer,
		length: bufs.length,
	};
}
//////////////////////////
/// set attrib or uniform
//////////////////////////
function enableBuffers(gl,attribL,uniformL,buffers){
	gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);
	gl.vertexAttribPointer(attribL.vertexPosition,3,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER,buffers.color);
	gl.vertexAttribPointer(attribL.vertexColor,4,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexColor);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.index);
}
function enableBuffersTex(gl,attribL,uniformL,buffers){
	gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);
	gl.vertexAttribPointer(attribL.vertexPosition,3,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER,buffers.color);
	gl.vertexAttribPointer(attribL.vertexColor,4,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.vertexColor);

	gl.bindBuffer(gl.ARRAY_BUFFER,buffers.textureCoord);
	gl.vertexAttribPointer(attribL.textureCoord,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(attribL.textureCoord);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.index);
}

function setUniformModelViewMatrix(gl,modelViewMatrix,uniformL){
	gl.uniformMatrix4fv(uniformL.modelViewMatrix,false,modelViewMatrix);
}
function setUniformParallelMatrix(gl,parallelMatrix,uniformL){
	gl.uniformMatrix4fv(uniformL.parallelMatrix,false,parallelMatrix);
}
////////////////
// for Texture
////////////////
let img = new Image();
function loadTexture(gl,source,textures){
//	let img = new Image();
	img.onload = function(){
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D,null);
		textures.push(tex);
		console.log("hello");
	}
	img.src = source;
}

function vsCodeTex(){
	return `
		attribute vec3 aVertexPosition;
		attribute vec4 aVertexColor;
		attribute vec2 aTextureCoord;
		uniform mat4 uModelViewMatrix;
		uniform vec4 uCharcterPosition;

		varying lowp vec4 vColor;
		varying lowp vec2 vTextureCoord;


		void main(){
			vec4 interPosition = vec4(aVertexPosition,1.0);

			mat4 parallelMatrix = mat4(
					 1.0,   0.0,   0.0, 0.0,
					 0.0,   1.0,   0.0, 0.0,
					 0.0,   0.0,   1.0, 0.0,
				uCharcterPosition[0],uCharcterPosition[1],uCharcterPosition[2], 1.0
			);
			float theta = uCharcterPosition[3];
			mat4 RotationMatrix = mat4(
				 cos(theta), sin(theta), 0.0, 0.0,
				-sin(theta), cos(theta), 0.0, 0.0,
								0.0,        0.0, 1.0, 0.0,
								0.0,        0.0, 0.0, 1.0
			);

			gl_Position = parallelMatrix * uModelViewMatrix * RotationMatrix * interPosition;
			vColor = aVertexColor;
			vTextureCoord = aTextureCoord;
		}
	`;
}
function fsCodeTex(){
	return `
		precision lowp float;
		uniform sampler2D texture;
		uniform float uTransparent;
		varying vec4 vColor;
		varying vec2 vTextureCoord;

		void main(){
			vec4 smpColor = texture2D(texture,vTextureCoord);
			gl_FragColor = vec4(vColor.xyz,vColor[3]*uTransparent) * smpColor;
		}
	`;
}
function textureBoard(){
	return {
		position : [
			-6.0, 6.0, 0.0,
			 6.0, 6.0, 0.0,
			-6.0,-6.0, 0.0,
			 6.0,-6.0, 0.0,
		],
		color : [
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
			1.0,1.0,1.0,1.0,
		],
		index : [
			0,1,2,
			3,2,1,
		],
		textureCoord : [
			0.0,0.0,
			1.0,0.0,
			0.0,1.0,
			1.0,1.0,
		],
	};
}
function textureAttribLocations(gl,shaderProgram){
	return {
		vertexPosition : gl.getAttribLocation(shaderProgram,"aVertexPosition"),
		vertexColor : gl.getAttribLocation(shaderProgram,"aVertexColor"),
		textureCoord : gl.getAttribLocation(shaderProgram,"aTextureCoord"),
	};
}
function textureUniformLocations(gl,shaderProgram){
	return {
		modelViewMatrix : gl.getUniformLocation(shaderProgram,"uModelViewMatrix"),
		charcterPosition : gl.getUniformLocation(shaderProgram,"uCharcterPosition"),
		texture : gl.getUniformLocation(shaderProgram,"uTexture"),
		transparent: gl.getUniformLocation(shaderProgram,"uTransparent"),
	}
}
function drawTexture(gl,shaderProgram,modelViewMatrix,attribLocations,uniformLocations,buffers,texture,charPos,transparent){
	gl.useProgram(shaderProgram);

	enableBuffersTex(gl,attribLocations,uniformLocations,buffers);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,texture);
	gl.uniform1i(uniformLocations.texture,0);
	setUniformModelViewMatrix(gl,modelViewMatrix,uniformLocations);
	gl.uniform4fv(uniformLocations.charcterPosition,charPos);
	gl.uniform1f(uniformLocations.transparent,transparent);

	gl.drawElements(gl.TRIANGLES,buffers.length,gl.UNSIGNED_SHORT,0);
}
