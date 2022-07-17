'use strict';

function checkKey(e) {

    e = e || window.event;

    // ignore warning for the ==, otherwise this wont work
    if (e.keyCode == '37') {
        // left arrow

        if (camRotation > -rotationLimit)
            camRotation -= keyRotationStrength;
    } else if (e.keyCode == '39') {
        // right arrow
        if (camRotation < rotationLimit)
            camRotation += keyRotationStrength;
    }
}

document.onkeydown = checkKey;


let elements = getAllElements();
const gl = elements.canvas.getContext("webgl");

const windowLowerLimit = -1000;
const windowLimit = 0;
const rotationLimit = 681;
let tolerance = 0.01;
let updateId;
let previousDelta = 0;
let fpsLimit = 15;
let camRotation = 0;
const keyRotationStrength = 10;

let fpsHistory = []
const level = 0;

const VBO = gl.createBuffer();

const drawOnlyAt = {
    Day: 0,
    Night: 1,
    DayAndNight: 2
}


async function init() {
    gl.enable(gl.DEPTH_TEST);

    let allPaths = getAllPaths();
    let allPrograms = await getPrograms(allPaths);
    let allVertices = await getAllVertices(allPaths);
    let allMaterials = await getAllMaterials(allPaths);
    let allTextures = getAllTextures();

    const fb = createFramebuffer(allTextures.firefly);

    let counter = 0;
    let windowPosition = 0;
    let posCounter = 0;

    // calc firefly positions
    let fireflyPos = getFireflyPosition();


    async function loop(currentDelta) {

        if (await handleFPS(currentDelta, loop)) {
            return;
        }

        counter -= 0.9;
        fpsLimit = elements.fpsSlider.value;

        // window animation
        const windowSpeed = 10;
        if (windowPosition <= windowLimit && elements.windowInput.innerHTML === "Open Window") {
            windowPosition += windowSpeed;
        } else if (windowPosition > windowLowerLimit && elements.windowInput.innerHTML !== "Open Window") {
            windowPosition -= windowSpeed;
        }


        // ++++++++++++++++++++ DRAW OPAQUE OBJECTS ++++++++++++++++++++
        disableTransparency();
        setFog(allPrograms);

        const cameraRotation = camRotation / 1000;
        const position = [0, 0.0, -2.0];
        const eye = [0, 1.0, 0];
        const look = [Math.sin(cameraRotation), 1, -Math.cos(cameraRotation)]

        // lighting settings day
        let light1 = createLighting([0.1, 0.1, 0.1, 0.1],[1., 1., 0.9, 1.], [0.1, 0.1, 0.1, 0.1],[3., 10., 0.]);
        let light2 = createLighting([0.1, 0.1, 0.1, 0.1],[1., 1., 1., 1.], [0.1, 0.1, 0.1, 0.1],[-3., -10., 0.]);
        // lighting settings night
        if (elements.dayOrNightInput.innerHTML === "Day") {
            light1 = createLighting([0.1, 0.1, 0.1, 0.1],[0.6, 0.7, 0.6, 0.6], [0.1, 0.1, 0.1, 0.1],[3., 10., 0.]);
            light2 = createLighting([0.0, 0.0, 0.0, 0.0],[0.5, 0.5, 0.5, 0.5], [0.1, 0.1, 0.1, 0.1],[-3., -10., 0.]);
        }
        setLighting(allPrograms.car, light1, light2, 10.0, eye);
        setLighting(allPrograms.dodgeCar, light1, light2, 10.0, eye);


        // skybox
        let skyboxTexture;
        const skyboxScaleFactor = 90.;
        const skyboxRotation = new Rotation(0, -160, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(allPrograms.skybox, skyboxPosition, allVertices.skybox);

        // skybox texture day
        skybox.setTexture(allTextures.skyboxDay);
        skyboxTexture = allTextures.skyboxDay;
        skybox.position.objectRotation = new Rotation(2, 201, 0);
        // skybox texture night
        if (elements.dayOrNightInput.innerHTML === "Day") {
            skybox.setTexture(allTextures.skyboxNight);
            skyboxTexture = allTextures.skyboxNight;
        }
        await skybox.draw(drawOnlyAt.DayAndNight)


        // Car
        // Inside
        const scaleFactorCar = 0.1;
        const carRotation = new Rotation(-90, 0, 0);
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
        const colaPosition = new Position(new Rotation(0., 0., 0.), [0., 0.55, -1.], [colaScaleFactor, -colaScaleFactor * 2, colaScaleFactor], eye, look);
        const cola = new DrawableObject(allPrograms.cola, colaPosition, allVertices.cola);
        setIntUniform(allPrograms.cola, 0, "texture");
        setIntUniform(allPrograms.cola, 1, "scratch");
        cola.setTexture(allTextures.cola);
        cola.setSecondTexture(allTextures.scratch);
        await cola.draw(drawOnlyAt.DayAndNight)


        // Rear Mirror
        const carRearMirror = new DrawableObject(allPrograms.carMirror, carPosition, allVertices.carRearMirror)
        setIntUniform(allPrograms.carMirror, 0, "u_texture");
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


        // movie
        // movie texture day
        let movieTexture = allTextures.movieDay;
        let textureVideo = elements.textureVideoDay;
        // movie texture night
        if (elements.dayOrNightInput.innerHTML === "Day") {
            movieTexture = allTextures.movieNight;
            textureVideo = elements.textureVideoNight;
        }

        const movieScaleFactor = 1.5;
        const moviePos = [-7., -2., -60.];
        const movieRotation = new Rotation(0., 30, 0)
        const moviePosition = new Position(movieRotation, moviePos, [-movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const movie = new DrawableObject(allPrograms.movie, moviePosition, allVertices.movie)
        movie.setTexture(movieTexture);
        setIntUniform(allPrograms.movie, 0, 'texture');
        bindVideoTexture(movieTexture, textureVideo)
        await movie.draw(drawOnlyAt.DayAndNight);

        const movieFramePosition = new Position(movieRotation, moviePos, [movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const movieFrame = new DrawableObject(allPrograms.movie, movieFramePosition, allVertices.movieFrame)
        await movieFrame.draw(drawOnlyAt.DayAndNight);


        // Dodge Car outside
        const dodgeCarPosition = new Position(new Rotation(-90, 0, 155), [-45, -13.0, -50.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(allPrograms.dodgeCar, dodgeCarPosition, allVertices.dodgeCar, allMaterials.dodgeCar)
        await dodgeCar.draw(drawOnlyAt.DayAndNight)

        // green dodge
        const greenDodgeCarPosition = new Position(new Rotation(-90, 0, -155), [45, -10.0, -55.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const greenDodgeCar = new DrawableObject(allPrograms.dodgeCar, greenDodgeCarPosition, allVertices.dodgeCar, allMaterials.dodgeGreenCar)
        await greenDodgeCar.draw(drawOnlyAt.DayAndNight)


        // tree
        const scaleFactorTree = 1.4;
        const treePosition = new Position(new Rotation(0, 60, 0), [17., -5.0, -90.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(allPrograms.tree, treePosition, allVertices.tree, allMaterials.tree)
        await tree.draw(drawOnlyAt.Day)
        
        // tree night
        const treeNight = new DrawableObject(allPrograms.tree, treePosition, allVertices.tree, allMaterials.treeNight)
        await treeNight.draw(drawOnlyAt.Night)
        


        // bat
        const scaleFactorBirds = 0.2;
        const birdsPosition = new Position(new Rotation(0, 0, 0), [17., 13.5, -70.0], [scaleFactorBirds, scaleFactorBirds, scaleFactorBirds], eye, look)
        const bat = new DrawableObject(allPrograms.bat, birdsPosition, allVertices.bat, allMaterials.bat)
        const birdsRotation = new Rotation(0, counter / 2, 0);
        bat.setRotationAfterTranslation(birdsRotation);
        await bat.draw(drawOnlyAt.Night)

        // bird
        const bird = new DrawableObject(allPrograms.bird, birdsPosition, allVertices.bird, allMaterials.bird)
        bird.setRotationAfterTranslation(birdsRotation);
        await bird.draw(drawOnlyAt.Day)


        // airship
        const scaleFactorAirship = 1;
        const airshipPosition = new Position(new Rotation(0, 200, 0), [-30., 15.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(allPrograms.airship, airshipPosition, allVertices.airship, allMaterials.airship)
        const airshipRotation = new Rotation(0, -counter / 10, 0);
        airship.setRotationAfterTranslation(airshipRotation);
        await airship.draw(drawOnlyAt.Day)

        // airship2
        const airshipRotation2 = new Rotation(0, -counter / 10 + 180, 0);
        airship.setRotationAfterTranslation(airshipRotation2);
        await airship.draw(drawOnlyAt.Day)


        // firefly counter
        posCounter += 1;
        if (posCounter >= fireflyPos.pos1.length)
            posCounter = 0;

        let scaleFactorFirefly = 0.005;
        let fireflyCount = 2;

        // draw firefly
        for (let i = 0; i < fireflyCount; i++) {
            // firefly bloom in framebuffer
            let pos = fireflyPos.pos1;
            if (i === 1) {
                pos = fireflyPos.pos2;
            }

            const fireflyFbPosition = new Position(new Rotation(0, 0, 0), [0, 1.0, -2.0], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, [0., 1., -1.])
            const fireflyFb = new DrawableObject(allPrograms.fireflyFb, fireflyFbPosition, allVertices.firefly, null, true);
            setVec4Uniform(allPrograms.fireflyFb, [1., 1., 0., 1.], 'color');
            fireflyFb.setTexture(allTextures.firefly);
            fireflyFb.setFramebuffer(fb);
            await fireflyFb.draw(drawOnlyAt.Night)

            // firefly without bloom
            const fireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, look)
            const firefly = new DrawableObject(allPrograms.fireflyFb, fireflyPosition, allVertices.firefly);
            setVec4Uniform(allPrograms.fireflyFb, [0.5, 1., 0., 1.], 'color');
            await firefly.draw(drawOnlyAt.Night)
        }


        // ++++++++++++++++++++ DRAW TRANSPARENT OBJECTS ++++++++++++++++++++
        enableTransparency(1.);
        // firefly canvas
        for (let i = 0; i < fireflyCount; i++) {
            let pos = fireflyPos.pos1;
            if (i === 1)
                pos = fireflyPos.pos2;
            scaleFactorFirefly = 1.;
            const canvasFireflyPosition = new Position(new Rotation(0, 0, 0), pos[posCounter], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
            const canvasFirefly = new DrawableObject(allPrograms.firefly, canvasFireflyPosition, [{vertices: canvasFireflyVertices}]);
            canvasFirefly.setTexture(allTextures.firefly);
            await canvasFirefly.draw(drawOnlyAt.Night);
        }

        enableTransparency(0.8);
        setVec3Uniform(allPrograms.carWindow, [0.1, 0.1, 0.1], 'windowColor', gl);
        // Windscreen
        const carWindscreen = new DrawableObject(allPrograms.carWindow, carPosition, allVertices.carWindscreen)
        await carWindscreen.draw(drawOnlyAt.DayAndNight)

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowPosition / 1000 * 0.419, windowPosition / 1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(allPrograms.carWindow, carDoorWindowLeftFrontPosition, allVertices.carDoorWindowLeftFront)
        await carDoorWindowLeftFront.draw(drawOnlyAt.DayAndNight)

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowPosition / 1000 * -0.419, windowPosition / 1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(allPrograms.carWindow, carDoorWindowRightFrontPosition, allVertices.carDoorWindowRightFront)
        await carDoorWindowRightFront.draw(drawOnlyAt.DayAndNight)
    }

    requestAnimationFrame(loop);
}

window.onload = init;