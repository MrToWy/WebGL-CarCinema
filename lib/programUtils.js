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
    elements.fpsLabel.textContent = fps.toFixed(1);
    elements.fpsAvgLabel.textContent = fpsAvg.toFixed(1);
}


/**
 * Prepares all programs.
 */
async function getPrograms(allPaths) {
    let allPrograms = {}

    // compile programs
    allPrograms.skybox = await getProgram(allPaths.skybox)
    allPrograms.movie = await getProgram(allPaths.movie)
    allPrograms.car = await getProgram(allPaths.car)
    allPrograms.dodgeCar = await getProgram(allPaths.dodgeCar)
    allPrograms.carMirror = await getProgram(allPaths.carMirror);
    allPrograms.carWindow = await getProgram(allPaths.carWindow);
    allPrograms.tree = await getProgram(allPaths.tree);
    allPrograms.airship = await getProgram(allPaths.airship);
    allPrograms.cola = await getProgram(allPaths.cola);
    allPrograms.firefly = await getProgram(allPaths.firefly);
    allPrograms.fireflyFb = await getProgram(allPaths.fireflyFb);
    allPrograms.bird = await getProgram(allPaths.bird);
    allPrograms.bat = await getProgram(allPaths.bat);

    return allPrograms;
}

/**
 * Load all obj files.
 */
async function getAllVertices(allPaths){
    let allVertices = {};
    allVertices.skybox = await getVertices( allPaths.skybox + "sphere.obj");
    allVertices.carInside = await getVertices( allPaths.car + "car_inside.obj");
    allVertices.carDoorLeftFront = await getVertices( allPaths.car + "car_door_left_front.obj");
    allVertices.carDoorRightFront = await getVertices( allPaths.car + "car_door_right_front.obj");
    allVertices.carDoorWindowLeftFront = await getVertices( allPaths.car + "car_door_window_left_front.obj");
    allVertices.carWindscreen = await getVertices(allPaths.car + "car_windscreen.obj");
    allVertices.carDoorWindowRightFront = await getVertices( allPaths.car + "car_door_window_right_front.obj");
    allVertices.carRearMirror = await getVertices(allPaths.car + "car_rear_mirror_2.obj");
    allVertices.carLeftMirror = await getVertices(allPaths.car + "car_mirror_left.obj");
    allVertices.carRightMirror = await getVertices(allPaths.car + "car_mirror_right.obj");
    allVertices.carAiring = await getVertices( allPaths.car + "car_airing.obj");
    allVertices.movie = await getVertices( allPaths.movie + "screen.obj");
    allVertices.structure = await getVertices( allPaths.movie + "structure.obj");
    allVertices.dodgeCar = await getVertices( allPaths.dodgeCar + "DodgeChallengerSRTHellcat2015.obj");
    allVertices.tree = await getVertices( allPaths.tree + "Tree_obj.obj");
    allVertices.airship = await getVertices( allPaths.airship + "Low-Poly_airship.obj");
    allVertices.cola = await getVertices( allPaths.cola + "cola.obj");
    allVertices.firefly = await getVertices( allPaths.firefly + "firefly.obj");
    allVertices.bird = await getVertices(allPaths.bird + "bird.obj");
    allVertices.bat = await getVertices(allPaths.bat + "bird.obj");

    return allVertices;

}

/**
 * Load all paths.
 */
function getAllPaths() {
    let allPaths = {};

    allPaths.cola = "objects/cola/"
    allPaths.skybox = "objects/skybox/"
    allPaths.car = "objects/car/"
    allPaths.carMirror = "objects/car/rear_mirror/"
    allPaths.carWindow = "objects/car/window/"
    allPaths.movie = "objects/movie/"
    allPaths.dodgeCar = "objects/car_dodge/"
    allPaths.airship = "objects/airship/"
    allPaths.tree = "objects/tree/"
    allPaths.firefly = "objects/firefly/"
    allPaths.fireflyFb = "objects/firefly/framebuffer/"
    allPaths.bird = "objects/birds/day/"
    allPaths.bat = "objects/birds/night/"

    return allPaths;
}

/**
 * Load all obj materials.
 */
async function getAllMaterials(allPaths) {
    let allMaterials = {};

    allMaterials.dodgeCar = await getMTL(allPaths.dodgeCar + "DodgeChallengerSRTHellcat2015.mtl");
    allMaterials.dodgeGreenCar = await getMTL(allPaths.dodgeCar + "GreenDodgeChallengerSRTHellcat2015.mtl");
    allMaterials.tree = await getMTL(allPaths.tree + "Tree_obj.mtl");
    allMaterials.airship = await getMTL(allPaths.airship + "Low-Poly_airship.mtl");
    allMaterials.bird = await getMTL(allPaths.bird + "bird.mtl");
    allMaterials.bat = await getMTL(allPaths.bat + "bird.mtl");

    return allMaterials;
}

/**
 * Load all textures.
 */
function getAllTextures(){
    let allTextures = {};

    allTextures.firefly = getFireflyTexture();
    allTextures.skyboxDay = getTextureForHtmlElement("skyboxDay");
    allTextures.skyboxNight = getTextureForHtmlElement("skyboxNight");
    allTextures.cola = getTextureForHtmlElement("cola");
    allTextures.scratch = getTextureForHtmlElement("colaScratch");
    allTextures.movieDay = getMovieScreenTexture(elements.textureVideoDay);
    allTextures.movieNight = getMovieScreenTexture(elements.textureVideoNight);

    return allTextures;
}

/**
 * Get a framebuffer object and bind the given texture.
 * @return {WebGLFramebuffer}      The created framebuffer
 * @param texture this will be loaded into the framebuffer
 */
function createFramebuffer(texture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    return fb;
}

/**
 * Load all HTML Elements.
 */
function getAllElements() {
    let elements = {};

    elements.fogNearInput = document.getElementById("fogNear");
    elements.fogFarInput = document.getElementById("fogFar");
    elements.dayOrNightInput = document.getElementById("dayOrNight");
    elements.windowInput = document.getElementById("window");
    elements.textureVideoDay = document.getElementById("videoTextureDay");
    elements.textureVideoNight = document.getElementById("videoTextureNight");
    elements.errorInput = document.getElementById("errors")
    elements.fpsLabel = document.getElementById("fps");
    elements.fpsAvgLabel = document.getElementById("fpsAvg");
    elements.fpsSlider = document.getElementById("fpsSlider");
    elements.canvas = document.getElementById("canvas");
    elements.cola = document.getElementById("cola");

    return elements;
}
