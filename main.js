'use strict';

const housePath = "objects/house/"
const skyboxPath = "objects/skybox/"
const carPath = "objects/car/"
const carMirrorPath = "objects/car/rear_mirror/"
const input = document.getElementById("input")
const fogNearInput = document.getElementById("fogNear")
const fogFarInput = document.getElementById("fogFar")

let tolerance = 0.01;
let updateId;
let previousDelta = 0;
let fpsLimit = 15;
const targetTextureWidth = 1024;
const targetTextureHeight = targetTextureWidth;
let camRotation = 0;
const keyRotationStrength = 1;


const fpsLabel = document.getElementById("fps");
const fpsAvgLabel = document.getElementById("fpsAvg");
const fpsSlider = document.getElementById("fpsSlider");
const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl");

const VBO = gl.createBuffer();

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;
    
    // ignore warning for the ==, otherwise this wont work
    if (e.keyCode == '37') {
        // left arrow
        camRotation -= keyRotationStrength;
    }
    else if (e.keyCode == '39') {
        // right arrow
        camRotation += keyRotationStrength;
    }
}

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

async function getVertices(gl, program, objPath){
    let request = await fetch(objPath);
    let boxText = await request.text();
    let vertices = objToVBO(boxText, program);

    await bindVerticesToBuffer(vertices);

    return vertices;
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

let fpsHistory = []

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

async function position(gl, program, objRotationAngle, cameraRotationAngle, translateVector3, scaleVector3, canvas, eye, look){
    gl.useProgram(program);
    let viewLocation = gl.getUniformLocation(program, 'mView');
    let projLocation = gl.getUniformLocation(program, 'mProj');
    let translLocation = gl.getUniformLocation(program, 'mTranslate');
    let scaleLocation = gl.getUniformLocation(program, 'mScale');
    let rotateLocation = gl.getUniformLocation(program, 'mRotate');
    let normalLocation = gl.getUniformLocation(program,'mNormale');

    let identityMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);
    let translateMatrix = new Float32Array(16);
    let scaleMatrix = new Float32Array(16);
    let rotateMatrix = new Float32Array(16);
    let normalMatrix = new Float32Array(9);
    var worldMatrix = new Float32Array(16);

    identity(identityMatrix);
    identity(viewMatrix);
    identity(projMatrix);
    identity(translateMatrix);
    identity(scaleMatrix);
    identity(rotateMatrix);
    identity(normalMatrix);

    lookAt(viewMatrix, eye, look, [0, 1, 0]);

    rotateX(rotateMatrix, rotateMatrix, objRotationAngle.x * Math.PI / 180);
    rotateY(rotateMatrix, rotateMatrix, objRotationAngle.y * Math.PI / 180);
    rotateZ(rotateMatrix, rotateMatrix, objRotationAngle.z * Math.PI / 180);

    translate(translateMatrix, translateMatrix, translateVector3)
    scale(scaleMatrix, scaleMatrix, scaleVector3);

    perspective(projMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    multiply(worldMatrix, scaleMatrix,rotateMatrix);
    multiply(worldMatrix, worldMatrix,translateMatrix);
    normalFromMat4(normalMatrix, worldMatrix);



    gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projLocation, gl.FALSE, projMatrix);
    gl.uniformMatrix4fv(translLocation, gl.FALSE, translateMatrix);
    gl.uniformMatrix4fv(scaleLocation, gl.FALSE, scaleMatrix);
    gl.uniformMatrix4fv(rotateLocation, gl.FALSE, rotateMatrix);
    gl.uniformMatrix3fv(normalLocation,gl.FALSE,normalMatrix);

    let camLocation = gl.getUniformLocation(program,'camDir');
    var inverseMat = new Float32Array(16);
    const camDir = new Float32Array(3);
    identity(inverseMat);
    inverseMat = mat3FromMat4(viewMatrix);
    inverseMat = invert3x3(inverseMat);
    vec3MulMat3(camDir, [0,0,1], inverseMat);
    gl.uniform3fv(camLocation, camDir);
}

const level = 0;

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

function getSkyboxTexture(){
    const skyboxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
    let textureImage = document.getElementById("skybox")
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return skyboxTexture;
}

function initFogForProgram(program){
    gl.useProgram(program);
    let fogNear = gl.getUniformLocation(program, 'fogNear');
    let fogFar = gl.getUniformLocation(program, 'fogFar');

    let fogNearValue = fogNearInput.value/1000.;
    let fogFarValue = fogFarInput.value/1000.;

    gl.uniform1f(fogNear, fogNearValue);
    gl.uniform1f(fogFar, fogFarValue);
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


async function init() {

    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    // compile programs
    const houseProgram = await getProgram(housePath, gl)
    const skyboxProgram = await getProgram(skyboxPath, gl)
    const carProgram = await getProgram(carPath, gl)
    const carMirrorProgram = await getProgram(carMirrorPath, gl);


    const skyboxVertices = await getVertices(gl, skyboxProgram, skyboxPath + "sphere.obj");

    const carInsideVertices = await getVertices(gl, carProgram, carPath + "car_inside.obj");
    const carDoorLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_left_front.obj");
    const carDoorRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_right_front.obj");
    const carDoorWindowLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_left_front.obj");
    const carWindscreenVertices = await getVertices(gl, carProgram, carPath + "car_windscreen.obj");
    const carDoorWindowRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_right_front.obj");
    const carRearMirrorVertices = await getVertices(gl, carMirrorProgram, carPath + "car_rear_mirror_2.obj");
    const carAiringVertices = await getVertices(gl, carProgram, carPath + "car_airing.obj");



    // create framebuffer
    let texture = getTextureForFramebuffer();
    let fb = getFramebuffer(texture);

    // skybox
    let skyboxTexture = getSkyboxTexture();
    
    gl.enable(gl.DEPTH_TEST);

    let counter = 0;

    async function loop(currentDelta) {

        if(await handleFPS(currentDelta, loop)) {
            return;
        }

        counter -= 0.3;
        
        

        fpsLimit = fpsSlider.value;

        
        initFogForProgram(houseProgram);

        const scaleFactorCar = 0.1;
        const position = [0,0.0,0.0];
        const eye = [0,1.0,2];
        const look = [0,1,0]
        const carCamRotation = new Rotation(-90, 0, camRotation);

        // draw opaque objects
        disableTransperency(gl);

        // skybox 
        const skyboxScaleFactor = 100;
        const skyboxRotation = new Rotation(0, camRotation, 0);
        const skyboxPosition = new Position(skyboxRotation, null, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(skyboxProgram, skyboxPosition,skyboxVertices,false)
        skybox.setTexture(skyboxTexture);
        await skybox.draw();




        // Car
        // Inside
        const carInsidePosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const car = new DrawableObject(carProgram, carInsidePosition, carInsideVertices, false)
        car.setTexture(null) // you could insert a texture here
        await car.draw()
        
        // Airing
        const carAiringPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carAiring = new DrawableObject(carProgram, carAiringPosition, carAiringVertices, false)
        await carAiring.draw()

        // Door Right Front
        const carDoorRightFrontPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorRightFront = new DrawableObject(carProgram, carDoorRightFrontPosition, carDoorRightFrontVertices, false)
        await carDoorRightFront.draw()

        // Door Left Front
        const carDoorLeftFrontPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorLeftFront = new DrawableObject(carProgram, carDoorLeftFrontPosition, carDoorLeftFrontVertices, false)
        await carDoorLeftFront.draw()

        gl.useProgram(carMirrorProgram);
        var textureLocation = gl.getUniformLocation(carMirrorProgram, "u_texture");
        gl.uniform1i(textureLocation, 0);


        // Rear Mirror
        const carRearMirrorPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carRearMirror = new DrawableObject(carMirrorProgram, carRearMirrorPosition, carRearMirrorVertices, false)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw()


        // draw transperent objects
        enableTransperency(0.8,gl);

        // Windscreen
        const carWindscreenPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carWindscreen = new DrawableObject(carProgram, carWindscreenPosition, carWindscreenVertices, false)
        await carWindscreen.draw()

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(carProgram, carDoorWindowLeftFrontPosition, carDoorWindowLeftFrontVertices, false)
        await carDoorWindowLeftFront.draw()

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carCamRotation, null, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices, false)
        await carDoorWindowRightFront.draw()

    }

    requestAnimationFrame(loop);
}

window.onload = init;