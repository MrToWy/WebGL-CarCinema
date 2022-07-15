'use strict';
const canvasFireflyVertices = [
    1., 1., 0.,     1., 1., 0.,0.,0.,
    -1., -1., 0.,   0., 0., 0.,0.,0.,
    -1., 1., 0.,    0., 1., 0.,0.,0.,
    1., -1., 0.,    1., 0., 0.,0.,0.,
    -1., -1., 0.,   0., 0., 0.,0.,0.,
    1., 1., 0.,     1., 1., 0.,0.,0.,
]

/**
 * Read shader code from a file and compile it.
 * @return {WebGLShader}      The compiled shader
 * @param shaderPath path to the shader code
 */
async function getShader(shaderPath){
    let response = await fetch(shaderPath);
    let shaderText = await response.text();

    const shader = gl.createShader(shaderPath.includes(".vert") ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderText);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.error('ERROR', gl.getShaderInfoLog(shader));

    return shader;
}

/**
 * creates a program with two shaders.
 * @return {WebGLProgram}      The program with compiled vertex and fragment shader.
 * @param shaderPath path to the shader code
 */
async function getProgram(shaderPath){

    const program = gl.createProgram();

    gl.attachShader(program, await getShader(shaderPath + "shader.vert"));
    gl.attachShader(program, await getShader(shaderPath + "shader.frag"));

    gl.linkProgram(program);
    gl.validateProgram(program);

    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        console.error('ERROR', gl.getProgramInfoLog(program));

    return program;
}

/**
 * Binds the default buffer and loads vertices.
 * @param vertices vertices which will be loaded into the buffer
 */
async function bindVerticesToBuffer(vertices){

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
        gl.STATIC_DRAW);

}

/**
 * Binds the default parameters which are contained in every shader.
 * @return {WebGLShader}      The compiled shader
 * @param program
 */
async function bindParameters(program){
    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "vertPosition");
    const colorAttributeLocation = gl.getAttribLocation(program, "vertNormal");
    const texCoordAttributeLocation = gl.getAttribLocation(program, "vertTexCoord");

    if(positionAttributeLocation >= 0){
        gl.vertexAttribPointer(positionAttributeLocation,
            3, gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            0);

        gl.enableVertexAttribArray(positionAttributeLocation);
    }

    if(colorAttributeLocation >= 0){
        gl.vertexAttribPointer(colorAttributeLocation,
            3, gl.FLOAT, gl.FALSE,
            8 * Float32Array.BYTES_PER_ELEMENT,
            5 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(colorAttributeLocation);
    }

    if(texCoordAttributeLocation >= 0){
        gl.vertexAttribPointer(texCoordAttributeLocation,
            2, gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(texCoordAttributeLocation);
    }
}


/**
 * Draw the given vertices as gl.TRIANGLES.
 */
async function draw(vertices){
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
        gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
}

/**
 * Create a texture that can be used in a framebuffer.
 * @return {WebGLTexture}      The created texture
 */
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


/**
 * Get a framebuffer object and bind the given texture.
 * @return {WebGLFramebuffer}      The created framebuffer
 * @param texture this will be loaded into the framebuffer
 */
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

/**
 * Will print any error to the console.
 */
function printError(){
    let error = gl.getError();
    if(error !== 0)
        console.log(error)
}

/**
 * Enables transparency.
 * @param alpha The alpha value used for the blend color. 1.0 is fully transparent.
 */
function enableTransparency(alpha) {
    gl.depthMask(false);
    gl.blendColor(0.0,0.0,0.0, alpha);
    gl.blendEquationSeparate(gl.FUNC_ADD,gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.CONSTANT_ALPHA,gl.CONSTANT_ALPHA,gl.CONSTANT_ALPHA);
    gl.enable(gl.BLEND);
}

/**
 * Disable transparency.
 */
function disableTransparency() {
    gl.depthMask(true);
    gl.disable(gl.BLEND);
}

/**
 * Wrapper to set a vector with a size of 3.
 * @param program The program which has the given uniform.
 * @param vec The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setVec3Uniform(program, vec, name) {
    if(vec === undefined) return;

    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform3f(uniformLocation, vec[0], vec[1], vec[2]);
}

/**
 * Wrapper to set a vector with a size of 4.
 * @param program The program which has the given uniform.
 * @param vec The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setVec4Uniform(program,vec,name) {
    if(vec === undefined) return;

    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform4f(uniformLocation,vec[0],vec[1],vec[2], vec[3]);
}

/**
 * Wrapper to set an int .
 * @param program The program which has the given uniform.
 * @param int The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setIntUniform(program,int,name) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform1i(uniformLocation,int);
}

/**
 * Wrapper to set a float .
 * @param program The program which has the given uniform.
 * @param float The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setFloatUniform(program,float,name) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniform1f(uniformLocation,float);
}

/**
 * Wrapper to set a mat with a size of 4x4.
 * @param program The program which has the given uniform.
 * @param mat4 The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setMat4Uniform(program, mat4,name) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniformMatrix4fv(uniformLocation,gl.FALSE,mat4);
}

/**
 * Wrapper to set a mat with a size of 3x3.
 * @param program The program which has the given uniform.
 * @param mat3 The data that should be set.
 * @param name The name of the uniform in the shader code.
 */
function setMat3Uniform(program, mat3,name) {
    gl.useProgram(program)
    let uniformLocation = gl.getUniformLocation(program, name);
    gl.uniformMatrix3fv(uniformLocation,gl.FALSE,mat3);
}


/**
 * Calculates the current fps and skips a frame if needed.
 * @return {boolean}      True if this frame should be skipped.
 * @param currentDelta  constantly incrementing counter, used to calc fps
 * @param loop the loop method that draws the scene
 */
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


/**
 * Prepares all programs.
 */
async function getPrograms() {
    let allPrograms = {}
    // compile programs
    allPrograms.skybox = await getProgram(skyboxPath)
    allPrograms.movie = await getProgram(moviePath)
    allPrograms.car = await getProgram(carPath)
    allPrograms.dodgeCar = await getProgram(dodgeCarPath)
    allPrograms.carMirror = await getProgram(carMirrorPath);
    allPrograms.carWindow = await getProgram(carWindowPath);
    allPrograms.tree = await getProgram(treePath);
    allPrograms.airship = await getProgram(airshipPath);
    allPrograms.cola = await getProgram(colaPath);
    allPrograms.firefly = await getProgram(fireflyPath);
    allPrograms.fireflyFb = await getProgram(fireflyFbPath);
    allPrograms.bird = await getProgram(birdPath);
    allPrograms.bat = await getProgram(batPath);

    return allPrograms;
}

/**
 * Load all obj files.
 */
async function getAllVertices(){
    let objVertices = {};
    objVertices.skybox = await getVertices( skyboxPath + "sphere.obj");
    objVertices.carInside = await getVertices( carPath + "car_inside.obj");
    objVertices.carDoorLeftFront = await getVertices( carPath + "car_door_left_front.obj");
    objVertices.carDoorRightFront = await getVertices( carPath + "car_door_right_front.obj");
    objVertices.carDoorWindowLeftFront = await getVertices( carPath + "car_door_window_left_front.obj");
    objVertices.carWindscreen = await getVertices(carPath + "car_windscreen.obj");
    objVertices.carDoorWindowRightFront = await getVertices( carPath + "car_door_window_right_front.obj");
    objVertices.carRearMirror = await getVertices(carPath + "car_rear_mirror_2.obj");
    objVertices.carLeftMirror = await getVertices(carPath + "car_mirror_left.obj");
    objVertices.carRightMirror = await getVertices(carPath + "car_mirror_right.obj");
    objVertices.carAiring = await getVertices( carPath + "car_airing.obj");
    objVertices.movie = await getVertices( moviePath + "screen.obj");
    objVertices.structure = await getVertices( moviePath + "structure.obj");
    objVertices.dodgeCar = await getVertices( dodgeCarPath + "DodgeChallengerSRTHellcat2015.obj");
    objVertices.tree = await getVertices( treePath + "Tree_obj.obj");
    objVertices.airship = await getVertices( airshipPath + "Low-Poly_airship.obj");
    objVertices.cola = await getVertices( colaPath + "cola.obj");
    objVertices.firefly = await getVertices( fireflyPath + "firefly.obj");
    objVertices.bird = await getVertices(birdPath + "bird.obj");
    objVertices.bat = await getVertices(batPath + "bird.obj");

    return objVertices;

}
