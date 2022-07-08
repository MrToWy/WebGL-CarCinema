'use strict';

const canvas = document.getElementById("canvas")
const gl = canvas.getContext("webgl");

const fireflyPath = "objects/firefly/"
const fireflyFbPath = "objects/firefly/framebuffer/"

const targetTextureWidth = gl.canvas.width;
const targetTextureHeight = targetTextureWidth;
const level = 0;
const VBO = gl.createBuffer();
let camRotation = 0;

async function init() {
    const fireflyProgram = await getProgram(fireflyPath, gl);
    const fireflyFbProgram = await getProgram(fireflyFbPath, gl);

    const fireflyVertices = await getVertices(gl, fireflyProgram, fireflyPath + "firefly.obj");
    const fireflyFbVertices = await getVertices(gl, fireflyFbProgram, fireflyPath + "firefly.obj");

    const texture = gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;

    const vertices = [
        1., 1., 0.,     1., 1., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        -1., 1., 0.,    0., 1., 0.,0.,0.,
        1., -1., 0.,    1., 0., 0.,0.,0.,
        -1., -1., 0.,   0., 0., 0.,0.,0.,
        1., 1., 0.,     1., 1., 0.,0.,0.,

    ]

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, targetTextureWidth, targetTextureHeight, border, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,texture, level);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    const cameraRotation = camRotation/1000;
    const eye = [0., 0.0, 0.];
    const look = [Math.sin(cameraRotation), 0, - Math.cos(cameraRotation)]

    async function loop() {
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);



        const scaleFactorFirefly = 1.0;
        const fireflyFbPosition = new Position(new Rotation(0, 0, 0), [0, 0.0, -7.0], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
        const fireflyFb = new DrawableObject(fireflyFbProgram, fireflyFbPosition, fireflyFbVertices, null, true);
        gl.useProgram(fireflyFbProgram);
        fireflyFb.setTexture(texture);
        fireflyFb.setFramebuffer(fb);
        await fireflyFb.draw();


        const fireflyPosition = new Position(new Rotation(0, 0, 0), [0, 0.0, -7.0], [scaleFactorFirefly, scaleFactorFirefly, scaleFactorFirefly], eye, look)
        const firefly = new DrawableObject(fireflyProgram, fireflyPosition, [{vertices:vertices}]);
        gl.useProgram(fireflyProgram);
        firefly.setTexture(texture);
        await firefly.draw();


        const scaleFactorFirefly2 = 1.;
        const fireflyFb2Position = new Position(new Rotation(0, 0, 0), [0., 0.0, -7.5], [scaleFactorFirefly2, scaleFactorFirefly2, scaleFactorFirefly2], eye, look)
        const fireflyFb2 = new DrawableObject(fireflyFbProgram, fireflyFb2Position, fireflyFbVertices);
        await fireflyFb2.draw();



    }

    requestAnimationFrame(loop);
}

window.onload = init;