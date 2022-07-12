'use strict';

function checkKey(e) {

    e = e || window.event;

    // ignore warning for the ==, otherwise this wont work
    if (e.keyCode == '37') {
        // left arrow
        
        if(camRotation > -rotationLimit)
            camRotation -= keyRotationStrength;
    }
    else if (e.keyCode == '39') {
        // right arrow
        if(camRotation < rotationLimit)
            camRotation += keyRotationStrength;
    }
}
document.onkeydown = checkKey;

const colaPath = "objects/cola/"
const housePath = "objects/house/"
const skyboxPath = "objects/skybox/"
const carPath = "objects/car/"
const carMirrorPath = "objects/car/rear_mirror/"
const carWindowPath = "objects/car/window/"
const moviePath = "objects/movie/"
const dodgeCarPath = "objects/car_dodge/"
const airshipPath = "objects/airship/"
const treePath = "objects/tree/"
const fireflyPath = "objects/firefly/"
const fireflyFbPath = "objects/firefly/framebuffer/"


const fogNearInput = document.getElementById("fogNear")
const fogFarInput = document.getElementById("fogFar")
const dayOrNightInput = document.getElementById("dayOrNight")
const windowInput = document.getElementById("window")
const textureVideo = document.getElementById("videoTexture")
const errorInput = document.getElementById("errors")

const windowLowerLimit = -1000;
const windowLimit = 0;
const rotationLimit = 681;
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
const cola = document.getElementById("cola")
const gl = canvas.getContext("webgl");

let fpsHistory = []
const level = 0;

const VBO = gl.createBuffer();

const drawOnlyAt  = {
    Day: 0,
    Night: 1,
    DayAndNight: 2

}



async function init() {
    // compile programs
    const skyboxProgram = await getProgram(skyboxPath, gl)
    const movieProgram = await getProgram(moviePath, gl)
    const carProgram = await getProgram(carPath, gl)
    const dodgeCarProgram = await getProgram(dodgeCarPath, gl)
    const carMirrorProgram = await getProgram(carMirrorPath, gl);
    const carWindowProgram = await  getProgram(carWindowPath, gl);
    const treeProgram = await  getProgram(treePath, gl);
    const airshipProgram = await  getProgram(airshipPath, gl);
    const colaProgram = await  getProgram(colaPath, gl);
    const fireflyProgram = await getProgram(fireflyPath, gl);
    const fireflyFbProgram = await getProgram(fireflyFbPath, gl);

    // get vertices
    const skyboxVertices = await getVertices(gl, skyboxPath + "sphere.obj");
    const carInsideVertices = await getVertices(gl, carPath + "car_inside.obj");
    const carDoorLeftFrontVertices = await getVertices(gl, carPath + "car_door_left_front.obj");
    const carDoorRightFrontVertices = await getVertices(gl, carPath + "car_door_right_front.obj");
    const carDoorWindowLeftFrontVertices = await getVertices(gl, carPath + "car_door_window_left_front.obj");
    const carWindscreenVertices = await getVertices(gl, carPath + "car_windscreen.obj");
    const carDoorWindowRightFrontVertices = await getVertices(gl, carPath + "car_door_window_right_front.obj");
    const carRearMirrorVertices = await getVertices(gl, carPath + "car_rear_mirror_2.obj");
    const carLeftMirrorVertices = await getVertices(gl,carPath + "car_mirror_left.obj");
    const carRightMirrorVertices = await getVertices(gl,carPath + "car_mirror_right.obj");
    const carAiringVertices = await getVertices(gl, carPath + "car_airing.obj");
    const movieVertices = await getVertices(gl, moviePath + "screen.obj");
    const structureVertices = await getVertices(gl, moviePath + "structure.obj");
    const dodgeCarVertices = await getVertices(gl, dodgeCarPath + "DodgeChallengerSRTHellcat2015.obj");
    const treeVertices = await getVertices(gl, treePath + "Tree_obj.obj");
    const airshipVertices = await getVertices(gl, airshipPath + "Low-Poly_airship.obj");
    const colaVertices = await getVertices(gl, colaPath + "cola.obj");
    const fireflyVertices = await getVertices(gl, fireflyPath + "firefly.obj");
    const canvasFireflyVertices = [
        1., 1., 0.,     1., 1., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        -1., 1., 0.,    0., 1., 0.,0.,0.,
        1., -1., 0.,    1., 0., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        1., 1., 0.,     1., 1., 0.,0.,0.,
    ]

    // materials
    const dodgeCarMaterials = await getMTL(dodgeCarPath + "DodgeChallengerSRTHellcat2015.mtl");
    const dodgeGreenCarMaterials = await getMTL(dodgeCarPath + "GreenDodgeChallengerSRTHellcat2015.mtl");
    const treeMaterials = await getMTL(treePath + "Tree_obj.mtl");
    const airshipMaterials = await getMTL(airshipPath + "Low-Poly_airship.mtl");


    let fireflyTexture = getFireflyTexture();
    
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fireflyTexture, 0);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // get textures
    let skyboxDayTexture = getTextureForHtmlElement("skyboxDay");
    let skyboxNightTexture = getTextureForHtmlElement("skyboxNight");
    let colaTexture = getTextureForHtmlElement("cola");
    let scratchTexture = getTextureForHtmlElement("colaScratch");
    gl.useProgram(colaProgram);
    const colatextureLocation = gl.getUniformLocation(colaProgram, "texture");
    gl.uniform1i(colatextureLocation, 0);
    const scratchTextureLocation = gl.getUniformLocation(colaProgram, "scratch");
    gl.uniform1i(scratchTextureLocation, 1);
    
    //movie screen
    let movieTexture = getMovieScreenTexture();

    gl.enable(gl.DEPTH_TEST);

    let counter = 0;
    let windowPosition = 0;
    let posCounter = 0;
    
    // calc firefly positions
    let positions = []
    for (let i = 0; i < 200; i++) {
        positions.push(calcFireflyPosition(i));
    }
    for (let i = 200; i > 0; i--) {
        positions.push(calcFireflyPosition(i));
    }

    // calc firefly positions
    let positions2 = []
    for (let i = -100; i < 100; i++) {
        positions2.push(calcFireflyPosition2(i));
    }
    for (let i = 100; i > -100; i--) {
        positions2.push(calcFireflyPosition2(i));
    }
    

    async function loop(currentDelta) {

        if(await handleFPS(currentDelta, loop)) {
            return;
        }

        counter -= 0.9;

        fpsLimit = fpsSlider.value;
        
        initFogForProgram(carMirrorProgram)
        initFogForProgram(skyboxProgram);
        initFogForProgram(movieProgram);
        initFogForProgram(dodgeCarProgram);
        initFogForProgram(treeProgram);
        initFogForProgram(airshipProgram);

        const cameraRotation = camRotation/1000;
        const scaleFactorCar = 0.1;
        const position = [0, 0.0, -2.0];
        const eye = [0, 1.0, 0];
        const look = [Math.sin(cameraRotation), 1, - Math.cos(cameraRotation)]
        const carRotation = new Rotation(-90, 0, 0);

        
        // window animation
        const windowSpeed = 10;
        if(windowPosition <= windowLimit && windowInput.innerHTML === "Open Window"){
            windowPosition += windowSpeed;
        }
        else if(windowPosition > windowLowerLimit && windowInput.innerHTML !== "Open Window"){
            windowPosition -= windowSpeed;
        }

        // draw opaque objects
        disableTransperency(gl);

        const lighingCar1 = new Lighting();
        lighingCar1.ambient = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar1.diffuse = new Color(1., 1., 1., 1.);
        lighingCar1.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar1.direction = [3., 10., 0.]

        const lighingCar2 = new Lighting();
        lighingCar2.ambient = new Color(0.1, 0.1, 0.1, 0.1,);
        lighingCar2.diffuse = new Color(1., 1., 1., 1.);
        lighingCar2.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar2.direction = [-3., -10., 0.]

        setLighting(carProgram, lighingCar1, lighingCar2, 10.0, eye);
        setLighting(dodgeCarProgram, lighingCar1, lighingCar2, 10.0, eye);


        let skyboxTexture;
        // skybox 
        const skyboxScaleFactor = 90.;
        const skyboxRotation = new Rotation(0, -160, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(skyboxProgram, skyboxPosition,skyboxVertices)

        if(dayOrNightInput.innerHTML === "Night"){
            skybox.setTexture(skyboxDayTexture);
            skyboxTexture = skyboxDayTexture;
            skybox.position.objectRotation = new Rotation(2, 201, 0);
        } else {
            skybox.setTexture(skyboxNightTexture);
            skyboxTexture = skyboxNightTexture;
        }
        await skybox.draw(drawOnlyAt.DayAndNight)


        // Car
        // Inside
        const carPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const car = new DrawableObject(carProgram, carPosition, carInsideVertices)
        await car.draw(drawOnlyAt.DayAndNight)

        // Airing
        const carAiring = new DrawableObject(carProgram, carPosition, carAiringVertices)
        await carAiring.draw(drawOnlyAt.DayAndNight)

        // Door Right Front
        const carDoorRightFront = new DrawableObject(carProgram, carPosition, carDoorRightFrontVertices)
        await carDoorRightFront.draw(drawOnlyAt.DayAndNight)

        // Door Left Front
        const carDoorLeftFront = new DrawableObject(carProgram, carPosition, carDoorLeftFrontVertices)
        await carDoorLeftFront.draw(drawOnlyAt.DayAndNight)

        // Cola
        const colaScaleFactor = 0.04;
        const colaPosition = new Position(new Rotation(0., 0., 0.), [0., 0.55, -1.], [colaScaleFactor, -colaScaleFactor*2, colaScaleFactor], eye, look)
        const cola = new DrawableObject(colaProgram, colaPosition, colaVertices)
        cola.setTexture(colaTexture);
        cola.setSecondTexture(scratchTexture);
        await cola.draw(drawOnlyAt.DayAndNight)


        setIntUniform(carMirrorProgram, 0 , "u_texture", gl);
        // Rear Mirror
        const carRearMirror = new DrawableObject(carMirrorProgram, carPosition, carRearMirrorVertices)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw(drawOnlyAt.DayAndNight);

        // Left Mirror
        const carLeftMirror = new DrawableObject(carMirrorProgram, carPosition, carLeftMirrorVertices)
        carLeftMirror.setTexture(skyboxTexture);
        await carLeftMirror.draw(drawOnlyAt.DayAndNight)

        // Right Mirror
        const carRightMirror = new DrawableObject(carMirrorProgram, carPosition, carRightMirrorVertices)
        carRightMirror.setTexture(skyboxTexture);
        await carRightMirror.draw(drawOnlyAt.DayAndNight)


        // movie
        const movieScaleFactor = 1.5;
        const moviePos =[-7., -2., -60.] ;
        const movieRotation = new Rotation(0., 30, 0)
        const moviePosition = new Position(movieRotation, moviePos,  [-movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const movie = new DrawableObject(movieProgram, moviePosition,  movieVertices)
        movie.setTexture(movieTexture);
        setIntUniform(movieProgram,0,'texture', gl);
        gl.bindTexture(gl.TEXTURE_2D, movieTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVideo)
        await movie.draw(drawOnlyAt.DayAndNight);

        const structurePosition = new Position(movieRotation, moviePos,  [movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const structure = new DrawableObject(movieProgram, structurePosition,  structureVertices)
        await structure.draw(drawOnlyAt.DayAndNight);


        // Dodge Car outside
        const dodgeCarPosition = new Position(new Rotation(-90, 0, 155), [-45, -13.0, -50.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(dodgeCarProgram, dodgeCarPosition, dodgeCarVertices, dodgeCarMaterials)
        await dodgeCar.draw(drawOnlyAt.DayAndNight)

        // green dodge
        const greenDodgeCarPosition = new Position(new Rotation(-90, 0, -155), [45, -10.0, -55.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const greenDodgeCar = new DrawableObject(dodgeCarProgram, greenDodgeCarPosition, dodgeCarVertices, dodgeGreenCarMaterials)
        await greenDodgeCar.draw(drawOnlyAt.DayAndNight)


        // tree
        const scaleFactorTree = 1.4;
        const treePosition = new Position(new Rotation(0, 60, 0), [17., -5.0, -90.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(treeProgram, treePosition, treeVertices, treeMaterials)
        await tree.draw(drawOnlyAt.DayAndNight)


        // airship
        const scaleFactorAirship = 1;
        const airshipPosition = new Position(new Rotation(0, 200, 0), [-30., 15.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(airshipProgram, airshipPosition, airshipVertices, airshipMaterials)
        const airshipRotation = new Rotation(0, -counter / 10, 0);
        airship.setRotationAfterTranslation(airshipRotation);
        await airship.draw(drawOnlyAt.Day)

        // airship2
        const airshipRotation2 = new Rotation(0, -counter / 10 + 180, 0);
        airship.setRotationAfterTranslation(airshipRotation2);
        await airship.draw(drawOnlyAt.Day)


        // Firefly
        posCounter += 1;
        if(posCounter >= positions.length)
            posCounter = 0;

        let scaleFactorFirefly = 0.005;
        let fireflyCount = 2;

        // draw firefly
        for (let i = 0; i < fireflyCount ; i++) {
            // firefly bloom in framebuffer
            let pos = positions;
            if(i === 1) {
                pos = positions2;
            }

            const fireflyFbPosition = new Position(new Rotation(0, 0, 0), [0, 1.0, -2.0], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, [0., 1., -1.])
            const fireflyFb = new DrawableObject(fireflyFbProgram, fireflyFbPosition, fireflyVertices, null, true);
            setVec4Uniform(fireflyFbProgram, [1., 1., 0., 1.], 'color', gl);
            fireflyFb.setTexture(fireflyTexture);
            fireflyFb.setFramebuffer(fb);
            await fireflyFb.draw(drawOnlyAt.Night)

            // firefly without bloom
            const fireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, look)
            const firefly = new DrawableObject(fireflyFbProgram, fireflyPosition, fireflyVertices);
            setVec4Uniform(fireflyFbProgram, [0.5, 1., 0., 1.], 'color', gl);
            await firefly.draw(drawOnlyAt.Night)
        }


        // draw transperent objects
        // firefly canvas
        for (let i = 0; i < fireflyCount; i++) {
            let pos = positions;
            if(i === 1)
                pos = positions2;
            enableTransperency(1., gl);
            scaleFactorFirefly = 1.;
            const canvasFireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
            const canvasFirefly = new DrawableObject(fireflyProgram, canvasFireflyPosition, [{vertices: canvasFireflyVertices}]);
            canvasFirefly.setTexture(fireflyTexture);
            await canvasFirefly.draw(drawOnlyAt.Night);
        }

        enableTransperency(0.8,gl);
        setVec3Uniform(carWindowProgram, [0.1,0.1,0.1],'windowColor', gl);
        // Windscreen
        const carWindscreen = new DrawableObject(carWindowProgram, carPosition, carWindscreenVertices)
        await carWindscreen.draw(drawOnlyAt.DayAndNight)

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowPosition/1000 * 0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(carWindowProgram, carDoorWindowLeftFrontPosition, carDoorWindowLeftFrontVertices)
        await carDoorWindowLeftFront.draw(drawOnlyAt.DayAndNight)

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowPosition/1000 * -0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carWindowProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices)
        await carDoorWindowRightFront.draw(drawOnlyAt.DayAndNight)
    }

    requestAnimationFrame(loop);
}

window.onload = init;