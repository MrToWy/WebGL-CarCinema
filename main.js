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

const testPath = "objects/tests/"
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
    const testProgram = await getProgram(testPath, gl)
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
    const treeVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "Tree_obj.obj");
    const airshipVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "Low-Poly_airship.obj");
    const airshipScreenVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "screen.obj");

    const dodgeCarMaterials = await getMTL(dodgeCarPath + "DodgeChallengerSRTHellcat2015.mtl");
    const treeMaterials = await getMTL(dodgeCarPath + "Tree_obj.mtl");
    const airshipMaterials = await getMTL(dodgeCarPath + "Low-Poly_airship.mtl");

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

        counter -= 0.9;



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
        const skyboxScaleFactor = 200;
        const skyboxRotation = new Rotation(0, 0, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(skyboxProgram, skyboxPosition,skyboxVertices)
        skybox.setTexture(skyboxTexture);
        await skybox.draw();




        // Car
        // Inside
        const carInsidePosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const car = new DrawableObject(carProgram, carInsidePosition, carInsideVertices)
        await car.draw()
        
        // Airing
        const carAiringPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carAiring = new DrawableObject(carProgram, carAiringPosition, carAiringVertices)
        await carAiring.draw()

        // Door Right Front
        const carDoorRightFrontPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorRightFront = new DrawableObject(carProgram, carDoorRightFrontPosition, carDoorRightFrontVertices)
        await carDoorRightFront.draw()

        // Door Left Front
        const carDoorLeftFrontPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorLeftFront = new DrawableObject(carProgram, carDoorLeftFrontPosition, carDoorLeftFrontVertices)
        await carDoorLeftFront.draw()


        gl.useProgram(carMirrorProgram);
        var textureLocation = gl.getUniformLocation(carMirrorProgram, "u_texture");
        gl.uniform1i(textureLocation, 0);


        // Rear Mirror
        const carRearMirrorPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carRearMirror = new DrawableObject(carMirrorProgram, carRearMirrorPosition, carRearMirrorVertices)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw()


        // Dodge Car outside
        const dodgeCarPosition = new Position(new Rotation(-90, 0, counter), [0, 0.0, -80.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(dodgeCarProgram, dodgeCarPosition, dodgeCarVertices, dodgeCarMaterials)
        await dodgeCar.draw()

        // tree
        const scaleFactorTree = 2;
        const treePosition = new Position(new Rotation(0, 0, 0), [-75., -10.0, -60.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(dodgeCarProgram, treePosition, treeVertices, treeMaterials)
        await tree.draw()


        // airship
        const scaleFactorAirship = 20;
        const airshipPosition = new Position(new Rotation(0, counter, 0), [-0., -0.0, -60.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(testProgram, airshipPosition, airshipVertices, airshipMaterials)
        airship.setFramebuffer(fb);
        airship.setTexture(null);
        await airship.draw()

        // airship
        const scaleFactorAirshipScreen = 2;
        const airshipScreenPosition = new Position(new Rotation(0, counter*5, 0), [-0., -0.0, -60.], [scaleFactorAirshipScreen, scaleFactorAirshipScreen, scaleFactorAirshipScreen], eye, look)
        const airshipScreen = new DrawableObject(dodgeCarProgram, airshipScreenPosition, airshipScreenVertices, null, true)
        airshipScreen.setTexture(texture);
        airshipScreen.setFramebuffer(fb);
        await airshipScreen.draw()


        // draw transperent objects
        enableTransperency(0.8,gl);
        setVec3Uniform(carWindowProgram, [0.1,0.1,0.1],'windowColor', gl);

        // Windscreen
        const carWindscreenPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carWindscreen = new DrawableObject(carWindowProgram, carWindscreenPosition, carWindscreenVertices)
        await carWindscreen.draw()

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowInput.value/1000 * 0.419,windowInput.value/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(carWindowProgram, carDoorWindowLeftFrontPosition, carDoorWindowLeftFrontVertices)
        await carDoorWindowLeftFront.draw()

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowInput.value/1000 * 0.419,windowInput.value/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carWindowProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices)
        await carDoorWindowRightFront.draw()
    }

    requestAnimationFrame(loop);
}

window.onload = init;