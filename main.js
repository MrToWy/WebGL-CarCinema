'use strict';

const teapotPath = "objects/teapot/"
const cubePath = "objects/cube/"
const tablePath = "objects/table/"
const housePath = "objects/house/"
const skyboxPath = "objects/skybox/"
const carPath = "objects/car/"
const input = document.getElementById("input")

let tolerance = 0.01;
let updateId;
let previousDelta = 0;
let fpsLimit = 30;
const targetTextureWidth = 1024;
const targetTextureHeight = targetTextureWidth;
let camRotation = -45;
const keyRotationStrength = 1;


const fpsLabel = document.getElementById("fps");
const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl");

const VBO = gl.createBuffer();

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;
    
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


async function bindParameters(gl, program, name){
    gl.useProgram(program);

    const teapotPositionAttributeLocation = gl.getAttribLocation(program, "vertPosition");

    gl.vertexAttribPointer(teapotPositionAttributeLocation,
        3, gl.FLOAT, false,
        8 * Float32Array.BYTES_PER_ELEMENT,
        0);

    gl.enableVertexAttribArray(teapotPositionAttributeLocation);



        const teapotColorAttributeLocation = gl.getAttribLocation(program, "vertNormal");

        gl.vertexAttribPointer(teapotColorAttributeLocation,
            3, gl.FLOAT, gl.FALSE,
            8 * Float32Array.BYTES_PER_ELEMENT,
            5 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(teapotColorAttributeLocation);



        const texCoordAttributeLocation = gl.getAttribLocation(program, "vertTexCoord");

        gl.vertexAttribPointer(texCoordAttributeLocation,
            2, gl.FLOAT, false,
            8 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(texCoordAttributeLocation);

}

async function draw(gl, vertices){
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
        gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
}

async function handleFPS(currentDelta, loop){

    // fps
    updateId = requestAnimationFrame(loop);
    const delta = currentDelta - previousDelta;
    const fps = 1000 / delta;

    if (fpsLimit && delta < (1000 / fpsLimit) - tolerance)
        return true;

    previousDelta = currentDelta;
    fpsLabel.textContent = fps.toFixed(1);
}

async function position(gl, program, objRotationAngle, cameraRotationAngle, translateVector3, scaleVector3, canvas, eye){
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
    var viewWorldMatrix = new Float32Array(16);

    identity(identityMatrix);
    identity(viewMatrix);
    identity(projMatrix);
    identity(translateMatrix);
    identity(scaleMatrix);
    identity(rotateMatrix);
    identity(normalMatrix);

    lookAt(viewMatrix, eye, [0, 0, 0], [0, 1, 0]);

    rotateX(rotateMatrix, rotateMatrix, objRotationAngle.x * Math.PI / 180);
    rotateY(rotateMatrix, rotateMatrix, objRotationAngle.y * Math.PI / 180);
    rotateZ(rotateMatrix, rotateMatrix, objRotationAngle.z * Math.PI / 180);

    translate(translateMatrix, translateMatrix, translateVector3)
    scale(scaleMatrix, scaleMatrix, scaleVector3);

    perspective(projMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    multiply(viewWorldMatrix, scaleMatrix,rotateMatrix);
    multiply(viewWorldMatrix, viewWorldMatrix,translateMatrix);
    normalFromMat4(normalMatrix, viewWorldMatrix);

    gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projLocation, gl.FALSE, projMatrix);
    gl.uniformMatrix4fv(translLocation, gl.FALSE, translateMatrix);
    gl.uniformMatrix4fv(scaleLocation, gl.FALSE, scaleMatrix);
    gl.uniformMatrix4fv(rotateLocation, gl.FALSE, rotateMatrix);
    gl.uniformMatrix3fv(normalLocation,gl.FALSE,normalMatrix);
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

function loadSkybox(){
    // texture
    let topImage = document.getElementById("top")
    let bottomImage = document.getElementById("bottom")
    let backImage = document.getElementById("back")
    let frontImage = document.getElementById("front")
    let leftImage = document.getElementById("left")
    let rightImage = document.getElementById("right")

    const cubeMapFaces = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            img: rightImage,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            img: topImage,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            img: frontImage,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            img: leftImage,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            img: bottomImage,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            img: backImage,
        },
    ];

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)


    const level = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    cubeMapFaces.forEach((cubeMapFace) =>{

        const {target, img} = cubeMapFace;

        // fill with img
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, level, internalFormat, format, type, img);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    })

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

async function init() {

    loadSkybox();
    
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    // compile programs
    const teapotProgram = await getProgram(teapotPath, gl)
    const cubeProgram = await getProgram(cubePath, gl)
    const tableProgram = await getProgram(tablePath, gl)
    const houseProgram = await getProgram(housePath, gl)
    const skyboxProgram = await getProgram(skyboxPath, gl)
    const carProgram = await getProgram(carPath, gl)

    // get vertices
    const teapotVertices = await getVertices(gl, teapotProgram, teapotPath + "teapot.obj")
    const cubeVertices = await getVertices(gl, cubeProgram, cubePath + "box.obj");
    const tableVertices = await getVertices(gl, cubeProgram, carPath + "table_tex.obj");
    const houseVertices = await getVertices(gl, houseProgram, housePath + "house.obj");
    const skyboxVertices = await getVertices(gl, skyboxProgram, skyboxPath + "box.obj");
    const carInsideVertices = await getVertices(gl, carProgram, carPath + "car_inside.obj");
    const carDoorLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_left_front.obj");
    const carDoorRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_right_front.obj");
    const carDoorWindowLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_left_front.obj");

    // create framebuffer
    let texture = getTextureForFramebuffer();
    let fb = getFramebuffer(texture);

    gl.enable(gl.DEPTH_TEST);

    let counter = 0;

    async function loop(currentDelta) {

        if(await handleFPS(currentDelta, loop)) {
            return;
        }

        counter -= 0.3;
        
        

        /*
        // teapot
        gl.clearColor(1., 0., 0., 1.);
        const teapotCamRotation = new Rotation(0, counter*-1, 0)
        const teapotPosition = new Position(teapotCamRotation, null, [0, 0, 0], [1, 1, 1], [0, 1, 7])
        const teapot = new DrawableObject(teapotProgram, null, teapotPosition, teapotPath + "teapot.obj", teapotVertices, fb, true)
        await teapot.draw()
        
        
        // cube
        gl.clearColor(0., 1., 0., 1.);
        const cubeCamRotation = new Rotation(0, counter, 0)
        const cubePosition = new Position(cubeCamRotation, null, [input.value/1000, 0.5, 0], [0.5, 0.5, 0.5], [0, 0, 10])
        const cube = new DrawableObject(cubeProgram, texture, cubePosition, cubePath + "box.obj", cubeVertices, fb, true, true)
        await cube.draw()


        // table 
        const tableScaleFactor = 0.002;
        const tableCamRotation = new Rotation(0, counter, 0)
        const tablePosition = new Position(tableCamRotation, null, [input.value/1000, 0.0, 0], [tableScaleFactor, tableScaleFactor, tableScaleFactor], [0, 0, 10])
        const table = new DrawableObject(tableProgram, null, tablePosition, tablePath + "table_tex.obj", tableVertices, null, false)
        await table.draw()



        // house 
        const scaleFactor = 1;
        const houseCamRotation = new Rotation(0, 0, 0)
        const housePosition = new Position(houseCamRotation, null, [-1, 0.0, 0], [scaleFactor, scaleFactor, scaleFactor], [0, 0, 10])
        const house = new DrawableObject(houseProgram, null, housePosition, housePath + "house.obj", houseVertices, null, false)
        await house.draw()
        
 

        
        // skybox 
        const skyboxScaleFactor = 1000;
        const skyboxRotation = new Rotation(0, 0, 0)
        const skyboxPosition = new Position(skyboxRotation, null, [0, 0.0, 0], [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], [0, 0, 10])
        const skybox = new DrawableObject(skyboxProgram, null, skyboxPosition, skyboxPath + "box.obj", skyboxVertices, null, false, null)
        await skybox.draw();

         */


        // car
        const scaleFactorCar = 0.05;
        gl.clearColor(0., 1., 0., 1.);

        // Inside
        const carCamRotation = new Rotation(-90, 0, camRotation);
        const carInsidePosition = new Position(carCamRotation, null, [0.6, -.5, 0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], [0, 0, 2])
        const car = new DrawableObject(carProgram, null, carInsidePosition, carPath + "car_inside.obj", carInsideVertices, null, true)
        await car.draw()

        // Door Right Front
        const carDoorRightFrontPosition = new Position(carCamRotation, null, [0.6, -.5, 0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], [0, 0, 2])
        const carDoorRightFront = new DrawableObject(carProgram, null, carDoorRightFrontPosition, carPath + "car_door_right_front.obj", carDoorRightFrontVertices, null, false)
        await carDoorRightFront.draw()

        // Door Left Front
        const carDoorLeftFrontPosition = new Position(carCamRotation, null, [0.6, -.5, 0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], [0, 0, 2])
        const carDoorLeftFront = new DrawableObject(carProgram, null, carDoorLeftFrontPosition, carPath + "car_door_left_front.obj", carDoorLeftFrontVertices, null, false)
        await carDoorLeftFront.draw()

        // Door Window Right Front
        const carDoorWindowLeftFrontPosition = new Position(carCamRotation, null, [0.6, -.5, 0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], [0, 0, 2])
        const carDoorWindowLeftFront = new DrawableObject(carProgram, null, carDoorWindowLeftFrontPosition, carPath + "car_door_left_front.obj", carDoorWindowLeftFrontVertices, null, false)
        await carDoorWindowLeftFront.draw()

    }

    requestAnimationFrame(loop);
}

window.onload = init;