let canvas_w = document.getElementById("main").offsetWidth;
let canvas_h = document.getElementById("main").offsetHeight;
document.getElementById("glcanvas").setAttribute("width",canvas_w);
document.getElementById("glcanvas").setAttribute("height",canvas_h);

main();

function main(){
    let gl = initCanvas();
    const vsSource = vsCode();
    const fsSource = fsCode();
    const ShaderProgram = initShaderProgram(gl,vsSource,fsSource);
    const programInfo = {
        program: ShaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(ShaderProgram,"aVertexPosition"),
            vertexColor: gl.getAttribLocation(ShaderProgram,"aVertexColor"),
            vertexNormal: gl.getAttribLocation(ShaderProgram,"aVertexNormal"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(ShaderProgram,"uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(ShaderProgram,"uModelViewMatrix"),
            invMatrix: gl.getUniformLocation(ShaderProgram,"uInvMatrix"),
            lightDirection: gl.getUniformLocation(ShaderProgram,"uLightDirection"),
        },
    };
    let buffers = initBuffers(gl);
    let cubeData = initCubeData();

    let then = 0.0;
    function render(now){
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        drawScene(gl,programInfo,buffers,cubeData,deltaTime);
        updateCubeData(cubeData);

        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}

function initCubeData(){
    let sz = 150;
    let ts = Array(sz);
    for(let i = 0; i < sz; i++){
        ts[i] = randPos();
        ts[i][0] += i*0.9;
        ts[i][1] += i*0.7;
    }
    return {
        num: sz,
        trans: ts,
        time: 0,
        pre: 0,
    };
}

function updateCubeData(cubeData){
    let flag = cubeData.time - cubeData.pre > 0.2;
    if(flag){
        cubeData.pre = cubeData.time;
    }
    for(let i = 0; i < cubeData.num;i++){
        if(isDisposable(cubeData.trans[i])){
            if(flag){
                cubeData.trans[i] = randPos();
                flag = false;
            }
        }
    }
    if(flag){
        cubeData.trans = cubeData.trans.concat([randPos()]);
        cubeData.num++;
    }
}

function randPos(){
    return [ rand(-50,-30),rand(-20,70),rand(-20,-100), ];
}
function rand(l,h){
    let r = Math.random();
    return l + r * (h-l);
}

function isDisposable(trans){
    return trans[0] > 50 || trans[1] > 50;
}

function initBuffers(gl){
    let cubes = getCube();

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubes.positions),gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubes.colors),gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(cubes.normals),gl.STATIC_DRAW);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubes.indices),gl.STATIC_DRAW);

    return {
        count: cubes.indices.length,
        position: positionBuffer,
        normal: normalBuffer,
        color: colorBuffer,
        index: indicesBuffer, 
        trans: cubes.trans,
    };
}

function drawScene(gl,programInfo,buffers,cubeData,deltaTime){
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fieldOfView = 45 * Math.PI / 180;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,fieldOfView,aspect,zNear,zFar);
    
    const lightDirection = vec3.fromValues(1.0,1.0,1.0);
    

    gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER,buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
    
    gl.bindBuffer(gl.ARRAY_BUFFER,buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,false,projectionMatrix);
    gl.uniform3fv(programInfo.uniformLocations.lightDirection,lightDirection);

    for(let i = 0;i < cubeData.num; i++){
        const modelViewMatrix = mat4.create();
        let trans = cubeData.trans[i];
        trans[0] += deltaTime*2;
        trans[1] += deltaTime*-1.5;
        mat4.translate(modelViewMatrix,modelViewMatrix,trans);
        mat4.rotate(modelViewMatrix,modelViewMatrix,cubeData.time*2,[0,0,1]);
        mat4.rotate(modelViewMatrix,modelViewMatrix,cubeData.time*3,[0,1,0]);
        
        const invMatrix = mat4.create();
        mat4.invert(invMatrix,modelViewMatrix);

        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,false,modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.invMatrix,false,invMatrix);

        gl.drawElements(gl.TRIANGLES,buffers.count,gl.UNSIGNED_SHORT,0);
    }
    cubeData.time += deltaTime;
}

function getCube(){
    let pos = [
        0.5,0.5,0.5,
        0.5,-0.5,0.5,
        0.5,-0.5,-0.5,
        0.5,0.5,-0.5,
        -0.5,0.5,0.5,
        -0.5,-0.5,0.5,
        -0.5,-0.5,-0.5,
        -0.5,0.5,-0.5,
    ];
    let nrml = [
        1.0,1.0,1.0,
        1.0,-1.0,1.0,
        1.0,-1.0,-1.0,
        1.0,1.0,-1.0,
        -1.0,1.0,1.0,
        -1.0,-1.0,1.0,
        -1.0,-1.0,-1.0,
        -1.0,1.0,-1.0,
    ];
    let idx = [
        0,1,2,
        0,2,3,
        4,0,3,
        4,3,7,
        5,4,7,
        5,7,6,
        1,5,6,
        1,6,2,
        0,4,5,
        0,5,1,
        2,6,7,
        2,7,3,
    ];
    let clr = [
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
        1.0,0.8,0.8,1.0,
    ];
    return {
        positions: pos,
        normals: nrml,
        indices: idx,
        colors: clr,
    };
}
