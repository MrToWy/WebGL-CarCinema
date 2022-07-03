'use strict';

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

const housePath = "objects/house/"
const skyboxPath = "objects/skybox/"
const carPath = "objects/car/"
const carMirrorPath = "objects/car/rear_mirror/"
const carWindowPath = "objects/car/window/"
const dodgeCarPath = "objects/car_dodge/"

const input = document.getElementById("input")
const fogNearInput = document.getElementById("fogNear")
const fogFarInput = document.getElementById("fogFar")
const windowInput = document.getElementById("window")

let tolerance = 0.01;
let updateId;
let previousDelta = 0;
let fpsLimit = 15;
const targetTextureWidth = 1024;
const targetTextureHeight = targetTextureWidth;
let camRotation = 0;
const keyRotationStrength = 10;


const fpsLabel = document.getElementById("fps");
const fpsAvgLabel = document.getElementById("fpsAvg");
const fpsSlider = document.getElementById("fpsSlider");
const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl");

let fpsHistory = []
const level = 0;

const VBO = gl.createBuffer();

document.onkeydown = checkKey;

async function init() {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    // compile programs
    const houseProgram = await getProgram(housePath, gl)
    const skyboxProgram = await getProgram(skyboxPath, gl)
    const carProgram = await getProgram(carPath, gl)
    const dodgeCarProgram = await getProgram(dodgeCarPath, gl)
    const carMirrorProgram = await getProgram(carMirrorPath, gl);
    const carWindowProgram = await  getProgram(carWindowPath, gl);


    const skyboxVertices = await getVertices(gl, skyboxProgram, skyboxPath + "sphere.obj");
    const carInsideVertices = await getVertices(gl, carProgram, carPath + "car_inside.obj");
    const carDoorLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_left_front.obj");
    const carDoorRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_right_front.obj");
    const carDoorWindowLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_left_front.obj");
    const carWindscreenVertices = await getVertices(gl, carProgram, carPath + "car_windscreen.obj");
    const carDoorWindowRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_right_front.obj");
    const carRearMirrorVertices = await getVertices(gl, carMirrorProgram, carPath + "car_rear_mirror_2.obj");
    const carAiringVertices = await getVertices(gl, carProgram, carPath + "car_airing.obj");
    const dodgeCarVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "DodgeChallengerSRTHellcat2015.obj");

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

        const cameraRotation = camRotation/1000;
        const scaleFactorCar = 0.1;
        const position = [0, 0.0, -2.0];
        const eye = [0, 1.0, 0];
        const look = [Math.sin(cameraRotation), 1, - Math.cos(cameraRotation)]
        const carRotation = new Rotation(-90, 0, 0);

        // draw opaque objects
        disableTransperency(gl);
        setLighting(carProgram,[-5.,0.,7.],[0.0,0.0,0.0],[1.,1.,1.],[0.1,0.1,0.1], 10.0, eye);

        // skybox 
        const skyboxScaleFactor = 100;
        const skyboxRotation = new Rotation(0, 0, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(skyboxProgram, skyboxPosition,skyboxVertices,false)
        skybox.setTexture(skyboxTexture);
        await skybox.draw();




        // Car
        // Inside
        const carInsidePosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const car = new DrawableObject(carProgram, carInsidePosition, carInsideVertices, false)
        await car.draw()
        
        // Airing
        const carAiringPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carAiring = new DrawableObject(carProgram, carAiringPosition, carAiringVertices, false)
        await carAiring.draw()

        // Door Right Front
        const carDoorRightFrontPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorRightFront = new DrawableObject(carProgram, carDoorRightFrontPosition, carDoorRightFrontVertices, false)
        await carDoorRightFront.draw()

        // Door Left Front
        const carDoorLeftFrontPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorLeftFront = new DrawableObject(carProgram, carDoorLeftFrontPosition, carDoorLeftFrontVertices, false)
        await carDoorLeftFront.draw()


        gl.useProgram(carMirrorProgram);
        var textureLocation = gl.getUniformLocation(carMirrorProgram, "u_texture");
        gl.uniform1i(textureLocation, 0);


        // Rear Mirror
        const carRearMirrorPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carRearMirror = new DrawableObject(carMirrorProgram, carRearMirrorPosition, carRearMirrorVertices, false)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw()


        // Door Window Right Front
        const dodgeCarPosition = new Position(new Rotation(-90, 0, counter), [0, 0.0, -80.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(dodgeCarProgram, dodgeCarPosition, dodgeCarVertices, false)
        await dodgeCar.draw()


        // draw transperent objects
        enableTransperency(0.8,gl);
        setVec3Uniform(carWindowProgram, [0.1,0.1,0.1],'windowColor', gl);

        // Windscreen
        const carWindscreenPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carWindscreen = new DrawableObject(carWindowProgram, carWindscreenPosition, carWindscreenVertices, false)
        await carWindscreen.draw()

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowInput.value/1000 * 0.419,windowInput.value/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(carWindowProgram, carDoorWindowLeftFrontPosition, carDoorWindowLeftFrontVertices, false)
        await carDoorWindowLeftFront.draw()

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowInput.value/1000 * 0.419,windowInput.value/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carWindowProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices, false)
        await carDoorWindowRightFront.draw()
    }

    requestAnimationFrame(loop);
}

window.onload = init;