function vsCode(){
	return `
		attribute vec4 aVertexPosition;
		attribute vec4 aVertexNormal;
		attribute vec4 aVertexColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uInvMatrix;
		uniform mat4 uProjectionMatrix;
		uniform vec3 uLightDirection;

		varying lowp vec4 vColor;
		
		void main(){
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
			
			vec3 normal = normalize(aVertexNormal.xyz); 
			vec3 invLight = normalize(uInvMatrix * vec4(uLightDirection,0.0)).xyz;
			float diffuse = clamp(dot(normal,invLight),0.8,1.0);
			vColor = aVertexColor * vec4(vec3(diffuse),1.0);
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
