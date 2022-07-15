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
const birdPath = "objects/birds/day/"
const batPath = "objects/birds/night/"

const fogNearInput = document.getElementById("fogNear")
const fogFarInput = document.getElementById("fogFar")
const dayOrNightInput = document.getElementById("dayOrNight")
const windowInput = document.getElementById("window")
const textureVideoDay = document.getElementById("videoTextureDay")
const textureVideoNight = document.getElementById("videoTextureNight")
const errorInput = document.getElementById("errors")
const fpsLabel = document.getElementById("fps");
const fpsAvgLabel = document.getElementById("fpsAvg");
const fpsSlider = document.getElementById("fpsSlider");
const canvas = document.getElementById("canvas")
const cola = document.getElementById("cola")
const gl = canvas.getContext("webgl");

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

let fpsHistory = []
const level = 0;

const VBO = gl.createBuffer();

const drawOnlyAt  = {
    Day: 0,
    Night: 1,
    DayAndNight: 2
}

async function init() {
    let allPrograms = await getPrograms();
    let allVertices = await getAllVertices();

    // materials
    const dodgeCarMaterials = await getMTL(dodgeCarPath + "DodgeChallengerSRTHellcat2015.mtl");
    const dodgeGreenCarMaterials = await getMTL(dodgeCarPath + "GreenDodgeChallengerSRTHellcat2015.mtl");
    const treeMaterials = await getMTL(treePath + "Tree_obj.mtl");
    const airshipMaterials = await getMTL(airshipPath + "Low-Poly_airship.mtl");
    const birdMaterials = await getMTL(birdPath + "bird.mtl");
    const batMaterials = await getMTL(batPath + "bird.mtl");


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
    gl.useProgram(allPrograms.cola);
    const colatextureLocation = gl.getUniformLocation(allPrograms.cola, "texture");
    gl.uniform1i(colatextureLocation, 0);
    const scratchTextureLocation = gl.getUniformLocation(allPrograms.cola, "scratch");
    gl.uniform1i(scratchTextureLocation, 1);
    
    //movie screen
    let movieTextureDay = getMovieScreenTexture(textureVideoDay);
    let movieTextureNight = getMovieScreenTexture(textureVideoNight);

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
        
        initFogForProgram(allPrograms.bird)
        initFogForProgram(allPrograms.bat)
        initFogForProgram(allPrograms.carMirror)
        initFogForProgram(allPrograms.skybox);
        initFogForProgram(allPrograms.movie);
        initFogForProgram(allPrograms.dodgeCar);
        initFogForProgram(allPrograms.tree);
        initFogForProgram(allPrograms.airship);

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
        disableTransparency();

        const lightingCar1 = new Lighting();
        const lightingCar2 = new Lighting();

        // Beleuchtung Tag
        if(dayOrNightInput.innerHTML === "Night"){
            lightingCar1.ambient = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar1.diffuse = new Color(1., 1., 1., 1.);
            lightingCar1.specular = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar1.direction = [3., 10., 0.]

            lightingCar2.ambient = new Color(0.1, 0.1, 0.1, 0.1,);
            lightingCar2.diffuse = new Color(1., 1., 1., 1.);
            lightingCar2.specular = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar2.direction = [-3., -10., 0.]
        } else { // Beleuchtung Nacht
            lightingCar1.ambient = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar1.diffuse = new Color(0.6, 0.6, 0.6, 1.0);
            lightingCar1.specular = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar1.direction = [3., 10., 0.]

            lightingCar2.ambient = new Color(0.0, 0.0, 0.0, 0.0,);
            lightingCar2.diffuse = new Color(0.5, 0.5, 0.5, 1.);
            lightingCar2.specular = new Color(0.1, 0.1, 0.1, 0.1);
            lightingCar2.direction = [-3., -10., 0.]
        }

        setLighting(allPrograms.car, lightingCar1, lightingCar2, 10.0, eye);
        setLighting(allPrograms.dodgeCar, lightingCar1, lightingCar2, 10.0, eye);


        let skyboxTexture;
        // skybox 
        const skyboxScaleFactor = 90.;
        const skyboxRotation = new Rotation(0, -160, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(allPrograms.skybox, skyboxPosition,allVertices.skybox);

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
        const car = new DrawableObject(allPrograms.car, carPosition, allVertices.carInside)
        await car.draw(drawOnlyAt.DayAndNight)

        // Airing
        const carAiring = new DrawableObject(allPrograms.car, carPosition, allVertices.carAiring)
        await carAiring.draw(drawOnlyAt.DayAndNight)

        // Door Right Front
        const carDoorRightFront = new DrawableObject(allPrograms.car, carPosition, allVertices.carDoorRightFront)
        await carDoorRightFront.draw(drawOnlyAt.DayAndNight)

        // Door Left Front
        const carDoorLeftFront = new DrawableObject(allPrograms.car, carPosition, allVertices.carDoorLeftFront)
        await carDoorLeftFront.draw(drawOnlyAt.DayAndNight)

        // Cola
        const colaScaleFactor = 0.04;
        const colaPosition = new Position(new Rotation(0., 0., 0.), [0., 0.55, -1.], [colaScaleFactor, -colaScaleFactor*2, colaScaleFactor], eye, look)
        const cola = new DrawableObject(allPrograms.cola, colaPosition, allVertices.cola)
        cola.setTexture(colaTexture);
        cola.setSecondTexture(scratchTexture);
        await cola.draw(drawOnlyAt.DayAndNight)


        setIntUniform(allPrograms.carMirror, 0 , "u_texture");
        // Rear Mirror
        const carRearMirror = new DrawableObject(allPrograms.carMirror, carPosition, allVertices.carRearMirror)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw(drawOnlyAt.DayAndNight);

        // Left Mirror
        const carLeftMirror = new DrawableObject(allPrograms.carMirror, carPosition, allVertices.carLeftMirror)
        carLeftMirror.setTexture(skyboxTexture);
        await carLeftMirror.draw(drawOnlyAt.DayAndNight)

        // Right Mirror
        const carRightMirror = new DrawableObject(allPrograms.carMirror, carPosition, allVertices.carRightMirror)
        carRightMirror.setTexture(skyboxTexture);
        await carRightMirror.draw(drawOnlyAt.DayAndNight)

        let movieTexture;
        let textureVideo;
        if(dayOrNightInput.innerHTML === "Night"){
           movieTexture = movieTextureDay;
           textureVideo = textureVideoDay;
        }else{
            movieTexture = movieTextureNight;
            textureVideo = textureVideoNight;
        }

        // movie
        const movieScaleFactor = 1.5;
        const moviePos =[-7., -2., -60.] ;
        const movieRotation = new Rotation(0., 30, 0)
        const moviePosition = new Position(movieRotation, moviePos,  [-movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const movie = new DrawableObject(allPrograms.movie, moviePosition,  allVertices.movie)
        movie.setTexture(movieTexture);
        setIntUniform(allPrograms.movie,0,'texture');
        gl.bindTexture(gl.TEXTURE_2D, movieTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVideo)
        await movie.draw(drawOnlyAt.DayAndNight);

        const structurePosition = new Position(movieRotation, moviePos,  [movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const structure = new DrawableObject(allPrograms.movie, structurePosition,  allVertices.structure)
        await structure.draw(drawOnlyAt.DayAndNight);


        // Dodge Car outside
        const dodgeCarPosition = new Position(new Rotation(-90, 0, 155), [-45, -13.0, -50.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(allPrograms.dodgeCar, dodgeCarPosition, allVertices.dodgeCar, dodgeCarMaterials)
        await dodgeCar.draw(drawOnlyAt.DayAndNight)

        // green dodge
        const greenDodgeCarPosition = new Position(new Rotation(-90, 0, -155), [45, -10.0, -55.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const greenDodgeCar = new DrawableObject(allPrograms.dodgeCar, greenDodgeCarPosition, allVertices.dodgeCar, dodgeGreenCarMaterials)
        await greenDodgeCar.draw(drawOnlyAt.DayAndNight)


        // tree
        const scaleFactorTree = 1.4;
        const treePosition = new Position(new Rotation(0, 60, 0), [17., -5.0, -90.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(allPrograms.tree, treePosition, allVertices.tree, treeMaterials)
        await tree.draw(drawOnlyAt.DayAndNight)


        // bat
        const scaleFactorBirds = 0.2;
        const birdsPosition = new Position(new Rotation(0, 0, 0), [17., 13.5, -70.0], [scaleFactorBirds, scaleFactorBirds, scaleFactorBirds], eye, look)
        const bat = new DrawableObject(allPrograms.bat, birdsPosition, allVertices.bat, batMaterials)
        const birdsRotation = new Rotation(0, counter / 2, 0);
        bat.setRotationAfterTranslation(birdsRotation);
        await bat.draw(drawOnlyAt.Night)

        // bird
        const bird = new DrawableObject(allPrograms.bird, birdsPosition, allVertices.bird, birdMaterials)
        bird.setRotationAfterTranslation(birdsRotation);
        await bird.draw(drawOnlyAt.Day)


        // airship
        const scaleFactorAirship = 1;
        const airshipPosition = new Position(new Rotation(0, 200, 0), [-30., 15.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(allPrograms.airship, airshipPosition, allVertices.airship, airshipMaterials)
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
            const fireflyFb = new DrawableObject(allPrograms.fireflyFb, fireflyFbPosition, allVertices.firefly, null, true);
            setVec4Uniform(allPrograms.fireflyFb, [1., 1., 0., 1.], 'color');
            fireflyFb.setTexture(fireflyTexture);
            fireflyFb.setFramebuffer(fb);
            await fireflyFb.draw(drawOnlyAt.Night)

            // firefly without bloom
            const fireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, look)
            const firefly = new DrawableObject(allPrograms.fireflyFb, fireflyPosition, allVertices.firefly);
            setVec4Uniform(allPrograms.fireflyFb, [0.5, 1., 0., 1.], 'color');
            await firefly.draw(drawOnlyAt.Night)
        }


        // draw transperent objects
        // firefly canvas
        for (let i = 0; i < fireflyCount; i++) {
            let pos = positions;
            if(i === 1)
                pos = positions2;
            enableTransparency(1.);
            scaleFactorFirefly = 1.;
            const canvasFireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
            const canvasFirefly = new DrawableObject(allPrograms.firefly, canvasFireflyPosition, [{vertices: canvasFireflyVertices}]);
            canvasFirefly.setTexture(fireflyTexture);
            await canvasFirefly.draw(drawOnlyAt.Night);
        }

        enableTransparency(0.8);
        setVec3Uniform(allPrograms.carWindow, [0.1,0.1,0.1],'windowColor', gl);
        // Windscreen
        const carWindscreen = new DrawableObject(allPrograms.carWindow, carPosition, allVertices.carWindscreen)
        await carWindscreen.draw(drawOnlyAt.DayAndNight)

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowPosition/1000 * 0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(allPrograms.carWindow, carDoorWindowLeftFrontPosition, allVertices.carDoorWindowLeftFront)
        await carDoorWindowLeftFront.draw(drawOnlyAt.DayAndNight)

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowPosition/1000 * -0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(allPrograms.carWindow, carDoorWindowRightFrontPosition, allVertices.carDoorWindowRightFront)
        await carDoorWindowRightFront.draw(drawOnlyAt.DayAndNight)
    }

    requestAnimationFrame(loop);
}

window.onload = init;