'use strict';

async function getShader(shaderPath, glContext){
    let response = await fetch(shaderPath);
    let shaderText = await response.text();

    const shader = glContext.createShader(shaderPath.includes(".vert") ? glContext.VERTEX_SHADER : glContext.FRAGMENT_SHADER);
    glContext.shaderSource(shader, shaderText);
    glContext.compileShader(shader);

    if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS))
        console.error('ERROR', glContext.getShaderInfoLog(shader));

    return shader;
}

async function getProgram(shaderPath, glContext){

    const program = glContext.createProgram();

    glContext.attachShader(program, await getShader(shaderPath + "shader.vert", glContext));
    glContext.attachShader(program, await getShader(shaderPath + "shader.frag", glContext));

    glContext.linkProgram(program);
    glContext.validateProgram(program);

    if (!glContext.getProgramParameter(program, glContext.VALIDATE_STATUS))
        console.error('ERROR', glContext.getProgramInfoLog(program));

    return program;
}

async function bindVerticesToBuffer(vertices, program){
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
        gl.STATIC_DRAW);

}

async function bindParameters(gl, program){
    gl.useProgram(program);

    const teapotPositionAttributeLocation = gl.getAttribLocation(program, "vertPosition");
    const teapotColorAttributeLocation = gl.getAttribLocation(program, "vertNormal");
    const texCoordAttributeLocation = gl.getAttribLocation(program, "vertTexCoord");

    if(teapotPositionAttributeLocation >= 0){
        gl.vertexAttribPointer(teapotPositionAttributeLocation,
            3, gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            0);

        gl.enableVertexAttribArray(teapotPositionAttributeLocation);
    }

    if(teapotColorAttributeLocation >= 0){
        gl.vertexAttribPointer(teapotColorAttributeLocation,
            3, gl.FLOAT, gl.FALSE,
            8 * Float32Array.BYTES_PER_ELEMENT,
            5 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(teapotColorAttributeLocation);
    }

    if(texCoordAttributeLocation >= 0){
        gl.vertexAttribPointer(texCoordAttributeLocation,
            2, gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(texCoordAttributeLocation);
    }
}

async function draw(gl, vertices){
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
        gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
}

function getTextureForFramebuffer(){
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, targetTextureWidth, targetTextureHeight, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}


function getFramebuffer(texture){
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,texture, 0);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    return fb;
}

function printError(gl){
    let error = gl.getError();
    if(error !== 0)
        console.log(error)
}

function enableTransperency(alpha, gl) {
    gl.depthMask(false);
    gl.blendColor(0.0,0.0,0.0,alpha);
    gl.blendEquationSeparate(gl.FUNC_ADD,gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.CONSTANT_ALPHA,gl.CONSTANT_ALPHA,gl.CONSTANT_ALPHA);
    gl.enable(gl.BLEND);
}

function disableTransperency(gl) {
    gl.depthMask(true);
    gl.disable(gl.BLEND);
}

function setVec3Uniform(program,vec,name,gl) {
    if(vec === undefined) return;

    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform3f(uniformLocation,vec[0],vec[1],vec[2]);
}

function setFloatUniform(program,float,name,gl) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform1f(uniformLocation,float);
}

function setMat4Uniform(program, mat4,name,gl) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniformMatrix4fv(uniformLocation,gl.FALSE,mat4);
}

function setMat3Uniform(program, mat3,name,gl) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniformMatrix3fv(uniformLocation,gl.FALSE,mat3);
}

async function handleFPS(currentDelta, loop){
    // fps
    updateId = requestAnimationFrame(loop);
    const delta = currentDelta - previousDelta;
    const fps = 1000 / delta;



    if (fpsLimit && delta < (1000 / fpsLimit) - tolerance)
        return true;

    fpsHistory.push(fps);
    if(fpsHistory.length > 100) fpsHistory.shift()
    const fpsAvg = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;

    previousDelta = currentDelta;
    fpsLabel.textContent = fps.toFixed(1);
    fpsAvgLabel.textContent = fpsAvg.toFixed(1);
}
