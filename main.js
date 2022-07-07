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
const airshipPath = "objects/airship/"
const treePath = "objects/tree/"

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
let camRotation = -600;
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
    const treeProgram = await  getProgram(treePath, gl);
    const airshipProgram = await  getProgram(airshipPath, gl);

    const skyboxVertices = await getVertices(gl, skyboxProgram, skyboxPath + "sphere.obj");
    const carInsideVertices = await getVertices(gl, carProgram, carPath + "car_inside.obj");
    const carDoorLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_left_front.obj");
    const carDoorRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_right_front.obj");
    const carDoorWindowLeftFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_left_front.obj");
    const carWindscreenVertices = await getVertices(gl, carProgram, carPath + "car_windscreen.obj");
    const carDoorWindowRightFrontVertices = await getVertices(gl, carProgram, carPath + "car_door_window_right_front.obj");
    const carRearMirrorVertices = await getVertices(gl, carMirrorProgram, carPath + "car_rear_mirror_2.obj");
    const carLeftMirrorVertices = await getVertices(gl, carMirrorProgram,carPath + "car_mirror_left.obj");
    const carRightMirrorVertices = await getVertices(gl, carMirrorProgram,carPath + "car_mirror_right.obj");
    const carAiringVertices = await getVertices(gl, carProgram, carPath + "car_airing.obj");
    const dodgeCarVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "DodgeChallengerSRTHellcat2015.obj");
    const treeVertices = await getVertices(gl, treeProgram, treePath + "Tree_obj.obj");
    const airshipVertices = await getVertices(gl, airshipProgram, airshipPath + "Low-Poly_airship.obj");

    const dodgeCarMaterials = await getMTL(dodgeCarPath + "DodgeChallengerSRTHellcat2015.mtl");
    const treeMaterials = await getMTL(treePath + "Tree_obj.mtl");
    const airshipMaterials = await getMTL(airshipPath + "Low-Poly_airship.mtl");

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

        const lighingCar1 = new Lighting();
        lighingCar1.ambient = new Color(0., 0., 0., 0.,);
        lighingCar1.diffuse = new Color(1., 1., 1., 1.);
        lighingCar1.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar1.direction = [5., 0., 7.]

        const lighingCar2 = new Lighting();
        lighingCar2.ambient = new Color(0., 0., 0., 0.,);
        lighingCar2.diffuse = new Color(1., 1., 1., 1.);
        lighingCar2.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar2.direction = [-5., 0., 7.]

        setLighting(carProgram, lighingCar1, lighingCar2, 10.0, eye);
        setLighting(dodgeCarProgram, lighingCar1, null, 10.0, eye);

        
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

        // Left Mirror
        const carLeftMirrorPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carLeftMirror = new DrawableObject(carMirrorProgram, carLeftMirrorPosition, carLeftMirrorVertices)
        carLeftMirror.setTexture(skyboxTexture);
        await carLeftMirror.draw()

        // Right Mirror
        const carRightMirrorPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carRightMirror = new DrawableObject(carMirrorProgram, carRightMirrorPosition, carRightMirrorVertices)
        carRightMirror.setTexture(skyboxTexture);
        await carRightMirror.draw()


        // Dodge Car outside
        const dodgeCarPosition = new Position(new Rotation(-110, 16, 155), [-130, -15.0, -100.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(dodgeCarProgram, dodgeCarPosition, dodgeCarVertices, dodgeCarMaterials)
        await dodgeCar.draw()

        // tree
        const scaleFactorTree = 2;
        const treePosition = new Position(new Rotation(0, 0, 0), [-65., -10.0, -150.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(treeProgram, treePosition, treeVertices, treeMaterials)
        await tree.draw()


        // airship
        const scaleFactorAirship = 1;
        const airshipPosition = new Position(new Rotation(0, 200, 0), [-30., 10.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(airshipProgram, airshipPosition, airshipVertices, airshipMaterials)
        const airshipRotation = new Rotation(0, -counter / 10, 0);
        airship.setRotationAfterTranslation(airshipRotation);
        await airship.draw()

        // airship2
        const airshipPosition2 = new Position(new Rotation(0, 200, 0), [-30., 10.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship2 = new DrawableObject(airshipProgram, airshipPosition2, airshipVertices, airshipMaterials)
        const airshipRotation2 = new Rotation(0, -counter / 10 + 180, 0);
        airship2.setRotationAfterTranslation(airshipRotation2);
        await airship2.draw()
        

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
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowInput.value/1000 * -0.419,windowInput.value/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carWindowProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices)
        await carDoorWindowRightFront.draw()
    }

    requestAnimationFrame(loop);
}

window.onload = init;