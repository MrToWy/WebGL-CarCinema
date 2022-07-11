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



async function init() {

    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

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
    const movieVertices = await getVertices(gl, movieProgram, moviePath + "screen.obj");
    const structureVertices = await getVertices(gl, movieProgram, moviePath + "structure.obj");
    const dodgeCarVertices = await getVertices(gl, dodgeCarProgram, dodgeCarPath + "DodgeChallengerSRTHellcat2015.obj");
    const treeVertices = await getVertices(gl, treeProgram, treePath + "Tree_obj.obj");
    const airshipVertices = await getVertices(gl, airshipProgram, airshipPath + "Low-Poly_airship.obj");
    const colaVertices = await getVertices(gl, airshipProgram, colaPath + "cola.obj");
    const fireflyVertices = await getVertices(gl, fireflyProgram, fireflyPath + "firefly.obj");
    const canvasFireflyVertices = [
        1., 1., 0.,     1., 1., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        -1., 1., 0.,    0., 1., 0.,0.,0.,
        1., -1., 0.,    1., 0., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        1., 1., 0.,     1., 1., 0.,0.,0.,
    ]

    const dodgeCarMaterials = await getMTL(dodgeCarPath + "DodgeChallengerSRTHellcat2015.mtl");
    const dodgeGreenCarMaterials = await getMTL(dodgeCarPath + "GreenDodgeChallengerSRTHellcat2015.mtl");
    const treeMaterials = await getMTL(treePath + "Tree_obj.mtl");
    const airshipMaterials = await getMTL(airshipPath + "Low-Poly_airship.mtl");


    let texture = gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;


    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, gl.canvas.width, gl.canvas.height, border, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,texture, level);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // get textures
    let skyboxTexture = getTextureForHtmlElement("skybox", 0);
    let colaTexture = getTextureForHtmlElement("cola", 0);
    let scratchTexture = getTextureForHtmlElement("colaScratch", 1);
    gl.useProgram(colaProgram);
    var colatextureLocation = gl.getUniformLocation(colaProgram, "texture");
    gl.uniform1i(colatextureLocation, 0);
    var scratchTextureLocation = gl.getUniformLocation(colaProgram, "scratch");
    gl.uniform1i(scratchTextureLocation, 1);
    
    //movie screen
    let movieTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, movieTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, textureVideo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.enable(gl.DEPTH_TEST);

    let counter = 0;
    let windowPosition = 0;
    let posCounter = 0;
    
    // calc firefly positions
    function calcFireflyPosition(i){
        const x = i.toFixed()/2000.;

        const buzzing = i%2===0?0.0005:0.;
        const sinus = Math.sin(x*1000.)/1000.;

        return [x, 1.0 + x + buzzing + sinus, -2.0]
    }

    let positions = [[0, 1.0, -2.0]]
    for (let i = 0; i < 200; i++) {
        positions.push(calcFireflyPosition(i));
    }
    for (let i = 200; i > 0; i--) {
        positions.push(calcFireflyPosition(i));
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
        if(windowPosition <= windowLimit && windowInput.checked){
            windowPosition += windowSpeed;
        }
        else if(windowPosition > windowLowerLimit && !windowInput.checked){
            windowPosition -= windowSpeed;
        }

        // draw opaque objects
        disableTransperency(gl);

        const lighingCar1 = new Lighting();
        lighingCar1.ambient = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar1.diffuse = new Color(1., 1., 1., 1.);
        lighingCar1.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar1.direction = [5., -10., -7.]

        const lighingCar2 = new Lighting();
        lighingCar2.ambient = new Color(0.1, 0.1, 0.1, 0.1,);
        lighingCar2.diffuse = new Color(1., 1., 1., 1.);
        lighingCar2.specular = new Color(0.1, 0.1, 0.1, 0.1);
        lighingCar2.direction = [5., 10., -7.]

        setLighting(carProgram, lighingCar1, lighingCar2, 10.0, eye);
        setLighting(dodgeCarProgram, lighingCar1, null, 10.0, eye);

        
        // skybox 
        const skyboxScaleFactor = 90.;
        const skyboxRotation = new Rotation(0, 90, 0);
        const skyboxPosition = new Position(skyboxRotation, position, [skyboxScaleFactor, skyboxScaleFactor, skyboxScaleFactor], eye, look)
        const skybox = new DrawableObject(skyboxProgram, skyboxPosition,skyboxVertices)
        skybox.setTexture(skyboxTexture);
        await skybox.draw()


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

        // cola
        const colaScaleFactor = 0.04;
        const colaPosition = new Position(new Rotation(0., 0., 0.), [0., 0.55, -1.], [colaScaleFactor, -colaScaleFactor*2, colaScaleFactor], eye, look)
        const cola = new DrawableObject(colaProgram, colaPosition, colaVertices)
        cola.setTexture(colaTexture);
        cola.setSecondTexture(scratchTexture);
        await cola.draw()


        gl.useProgram(carMirrorProgram);
        var textureLocation = gl.getUniformLocation(carMirrorProgram, "u_texture");
        gl.uniform1i(textureLocation, 0);


        // Rear Mirror
        const carRearMirrorPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carRearMirror = new DrawableObject(carMirrorProgram, carRearMirrorPosition, carRearMirrorVertices)
        carRearMirror.setTexture(skyboxTexture);
        await carRearMirror.draw();

        // movie
        const movieScaleFactor = 0.65;
        const moviePos =[-7., -2., -60.] ;
        const movieRotation = new Rotation(0., 30, 0)
        const moviePosition = new Position(movieRotation, moviePos,  [-movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const movie = new DrawableObject(movieProgram, moviePosition,  movieVertices )
        movie.setTexture(movieTexture);
        setIntUniform(movieProgram,0,'texture',gl);
        gl.bindTexture(gl.TEXTURE_2D, movieTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVideo)

        await movie.draw();

        const structurePosition = new Position(movieRotation, moviePos,  [movieScaleFactor, movieScaleFactor, movieScaleFactor], eye, look)
        const structure = new DrawableObject(movieProgram, structurePosition,  structureVertices)
        await structure.draw();


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
        const dodgeCarPosition = new Position(new Rotation(-90, 0, 155), [-45, -13.0, -70.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const dodgeCar = new DrawableObject(dodgeCarProgram, dodgeCarPosition, dodgeCarVertices, dodgeCarMaterials)
        await dodgeCar.draw()


        const greenDodgeCarPosition = new Position(new Rotation(-90, 0, -155), [45, -10.0, -65.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const greenDodgeCar = new DrawableObject(dodgeCarProgram, greenDodgeCarPosition, dodgeCarVertices, dodgeGreenCarMaterials)
        await greenDodgeCar.draw()

        // tree
        const scaleFactorTree = 0.7;
        const treePosition = new Position(new Rotation(0, 0, 0), [5., -5.0, -90.0], [scaleFactorTree, scaleFactorTree, scaleFactorTree], eye, look)
        const tree = new DrawableObject(treeProgram, treePosition, treeVertices, treeMaterials)
        await tree.draw()


        // airship
        const scaleFactorAirship = 1;
        const airshipPosition = new Position(new Rotation(0, 200, 0), [-30., 15.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship = new DrawableObject(airshipProgram, airshipPosition, airshipVertices, airshipMaterials)
        const airshipRotation = new Rotation(0, -counter / 10, 0);
        airship.setRotationAfterTranslation(airshipRotation);
        await airship.draw()

        // airship2
        const airshipPosition2 = new Position(new Rotation(0, 200, 0), [-30., 15.0, -70.], [scaleFactorAirship, scaleFactorAirship, scaleFactorAirship], eye, look)
        const airship2 = new DrawableObject(airshipProgram, airshipPosition2, airshipVertices, airshipMaterials)
        const airshipRotation2 = new Rotation(0, -counter / 10 + 180, 0);
        airship2.setRotationAfterTranslation(airshipRotation2);
        await airship2.draw()

        gl.enable(gl.DEPTH_TEST);
        
        // bloom
        let scaleFactorFirefly = 0.005;
        const fireflyFbPosition = new Position(new Rotation(0, 0, 0), [0, 1.0, -2.0], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, [0.,1.,-1.])
        const fireflyFb = new DrawableObject(fireflyFbProgram, fireflyFbPosition, fireflyVertices, null, true);
        setVec4Uniform(fireflyFbProgram,[1.,1.,0.,1.], 'color', gl);
        fireflyFb.setTexture(texture);
        fireflyFb.setFramebuffer(fb);
        await fireflyFb.draw()


        // inner firefly+
        posCounter += 1;
        
        if(posCounter >= positions.length)
            posCounter = 0;
        
        const fireflyPosition = new Position(new Rotation(0, 0, 0), positions[posCounter], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, look)
        const firefly = new DrawableObject(fireflyFbProgram, fireflyPosition, fireflyVertices);
        setVec4Uniform(fireflyFbProgram,[0.5,1.,0.,1.], 'color', gl);
        const rotation = new Rotation(0, -0 / 10 , 0);
        firefly.setRotationAfterTranslation(rotation);
        await firefly.draw()

        
        // second inner firefly
        const fireflyPosition2 = new Position(new Rotation(0, 0, 0), [0, 1.0, -2.0], [scaleFactorFirefly, scaleFactorFirefly / 2, scaleFactorFirefly], eye, look)
        const firefly2 = new DrawableObject(fireflyFbProgram, fireflyPosition2, fireflyVertices);
        setVec4Uniform(fireflyFbProgram,[0.5,1.,0.,1.], 'color', gl);
        const rotation2 = new Rotation(0, -0 / 10 , 0);
        firefly2.setRotationAfterTranslation(rotation2);
        await firefly2.draw()



        // draw transperent objects
        enableTransperency(0.8,gl);
        setVec3Uniform(carWindowProgram, [0.1,0.1,0.1],'windowColor', gl);

        // Windscreen
        const carWindscreenPosition = new Position(carRotation, position, [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carWindscreen = new DrawableObject(carWindowProgram, carWindscreenPosition, carWindscreenVertices)
        await carWindscreen.draw()

        // Door Window Left Front
        const carDoorWindowLeftFrontPosition = new Position(carRotation, [windowPosition/1000 * 0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowLeftFront = new DrawableObject(carWindowProgram, carDoorWindowLeftFrontPosition, carDoorWindowLeftFrontVertices)
        await carDoorWindowLeftFront.draw()

        // Door Window Right Front
        const carDoorWindowRightFrontPosition = new Position(carRotation, [windowPosition/1000 * -0.419,windowPosition/1000, -2.0], [scaleFactorCar, scaleFactorCar, scaleFactorCar], eye, look)
        const carDoorWindowRightFront = new DrawableObject(carWindowProgram, carDoorWindowRightFrontPosition, carDoorWindowRightFrontVertices)
        await carDoorWindowRightFront.draw()

        // firefly canvas
        enableTransperency(1.,gl);
        scaleFactorFirefly = 1.;
        const canvasFireflyPosition = new Position(new Rotation(0, 0, 0), positions[posCounter], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
        const canvasFirefly = new DrawableObject(fireflyProgram, canvasFireflyPosition, [{vertices:canvasFireflyVertices}]);
        canvasFirefly.setTexture(texture);
        canvasFirefly.setRotationAfterTranslation(rotation);
        await canvasFirefly.draw();

        // second firefly canvas
        enableTransperency(1.,gl);
        scaleFactorFirefly = 1.;
        const canvasFireflyPosition2 = new Position(new Rotation(0, 0, 0), [0, 1.0, -2.0], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
        const canvasFirefly2 = new DrawableObject(fireflyProgram, canvasFireflyPosition2, [{vertices:canvasFireflyVertices}]);
        canvasFirefly2.setTexture(texture);
        canvasFirefly2.setRotationAfterTranslation(rotation);
        await canvasFirefly2.draw();
    }

    requestAnimationFrame(loop);
}

window.onload = init;