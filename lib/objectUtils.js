'use strict';

async function getVertices(objPath){
    let request = await fetch(objPath);
    let boxText = await request.text();
    let vertices = objToVBO(boxText);

    for (const geometry of vertices) {
        await bindVerticesToBuffer(geometry);
    }

    return vertices;
}

function createMatrix(length){
    let matrix = new Float32Array(length);
    identity(matrix);
    return matrix;
}

async function position(program, objRotationAngle, translateVector3, scaleVector3, canvas, eye, look, objRotationAfterTranslationAngle){
    gl.useProgram(program);
    let viewMatrix = createMatrix(16);
    let projMatrix = createMatrix(16);
    let translateMatrix = createMatrix(16);
    let scaleMatrix = createMatrix(16);
    let rotateMatrix = createMatrix(16);
    let worldMatrix = createMatrix(16);
    let normalMatrix = createMatrix(9);
    let inverseMat;
    const camDir = createMatrix(3);
    let rotateAfterTransMatrix = createMatrix(16);


    lookAt(viewMatrix, eye, look, [0, 1, 0]);

    if(objRotationAngle !== null){
        rotateX(rotateMatrix, rotateMatrix, objRotationAngle.x * Math.PI / 180);
        rotateY(rotateMatrix, rotateMatrix, objRotationAngle.y * Math.PI / 180);
        rotateZ(rotateMatrix, rotateMatrix, objRotationAngle.z * Math.PI / 180);
    }
    if(objRotationAfterTranslationAngle !== null && objRotationAfterTranslationAngle !== undefined){
        rotateX(rotateAfterTransMatrix, rotateAfterTransMatrix, objRotationAfterTranslationAngle.x * Math.PI / 180);
        rotateY(rotateAfterTransMatrix, rotateAfterTransMatrix, objRotationAfterTranslationAngle.y * Math.PI / 180);
        rotateZ(rotateAfterTransMatrix, rotateAfterTransMatrix, objRotationAfterTranslationAngle.z * Math.PI / 180);
        setMat4Uniform(program,rotateAfterTransMatrix, 'mRotateAfterTrans');
    }

    translate(translateMatrix, translateMatrix, translateVector3)
    scale(scaleMatrix, scaleMatrix, scaleVector3);

    perspective(projMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    multiply(worldMatrix, scaleMatrix,rotateMatrix);
    multiply(worldMatrix, worldMatrix,translateMatrix);
    normalFromMat4(normalMatrix, worldMatrix);

    setMat4Uniform(program,viewMatrix,'mView');
    setMat4Uniform(program,projMatrix,'mProj');
    setMat4Uniform(program,translateMatrix,'mTranslate');
    setMat4Uniform(program,scaleMatrix,'mScale');
    setMat4Uniform(program,rotateMatrix,'mRotate');
    setMat3Uniform(program,normalMatrix,'mNormale');
}

function getMovieScreenTexture(textureInput){
    const movieTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, movieTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, textureInput);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return movieTexture;
}

function getFireflyTexture(){
    const fireflyTexture = gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;

    gl.bindTexture(gl.TEXTURE_2D, fireflyTexture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, gl.canvas.width, gl.canvas.height, border, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return fireflyTexture;
}

function getTextureForHtmlElement(elementId){
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    let textureImage = document.getElementById(elementId)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
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


function setLighting(program, lighting1, lighting2, alpha, eye) {

    setVec3Uniform(program, lighting1.direction,'lightDirection');
    setVec3Uniform(program, lighting1.ambient.array(), 'ambiente');
    setVec3Uniform(program, lighting1.diffuse.array(), 'diffuse');
    setVec3Uniform(program, lighting1.specular.array(), 'specular');
    setVec3Uniform(program, eye,'eyeDir');
    setFloatUniform(program, alpha, 'alpha');

    if(lighting2 !== null){
        setVec3Uniform(program, lighting2.direction,'lightDirection2');
        setVec3Uniform(program, lighting2.ambient.array(), 'ambiente2');
        setVec3Uniform(program, lighting2.diffuse.array(), 'diffuse2');
        setVec3Uniform(program, lighting2.specular.array(), 'specular2');
    }
}

function objToVBO(objString) {

    let objArray = objString.split("\n");
    let v = [];
    let vt = [];
    let vn = [];
    let vbo = [];
    let geometry = [];
    let currentMaterialName = undefined;

    for (let i = 0; i < objArray.length; i++) {
        let line = objArray[i];

        let columns = line.split(" ");
        let prefix = columns[0];

        if (prefix === "v") {
            let x = parseFloat(columns[1]);
            let y = parseFloat(columns[2]);
            let z = parseFloat(columns[3]);

            v.push([x, y, z]);
        } else if (prefix === "vt") {
            let x = parseFloat(columns[1]);
            let y = parseFloat(columns[2]);

            vt.push([x, y]);
        } else if (prefix === "vn") {
            let x = parseFloat(columns[1]);
            let y = parseFloat(columns[2]);
            let z = parseFloat(columns[3]);

            vn.push([x, y, z]);
        } else if (prefix === "f") {

            for (let j = 1; j < 4; j++) {
                let triplet = columns[j].split("/");

                let verticesIndex = triplet[0] - 1;
                let texturesIndex = triplet[1] - 1;
                let normalIndex = triplet[2] - 1;

                // push vertices
                vbo.push(v[verticesIndex][0], v[verticesIndex][1], v[verticesIndex][2]);

                // push textures
                if(vt[texturesIndex] !== undefined)
                    vbo.push(vt[texturesIndex][0], vt[texturesIndex][1]);
                else {
                    vbo.push(0., 0.);
                }

                // push normals
                if(vn[normalIndex] !== undefined)
                    vbo.push(vn[normalIndex][0], vn[normalIndex][1], vn[normalIndex][2]);
                else {
                    vbo.push(0., 0., 0.);
                }
            }
        } else if(prefix === "usemtl")
        {
            if(vbo.length > 0){
                geometry.push({material: currentMaterialName, vertices: vbo});
                vbo = [];
            }

            currentMaterialName = columns[1].split(":")[1];

            if(currentMaterialName === undefined) currentMaterialName = columns[1]


        }
    }

    if(vbo.length > 0) geometry.push({material: "default", vertices: vbo});
    
    return geometry;
}

async function getMTL(path) {
    let request = await fetch(path);
    let MTLString = await request.text();

    let mtlArray = MTLString.split("\n");

    let materials = [];

    let currentMaterial = null;

    for (let i = 0; i < mtlArray.length; i++) {
        let line = mtlArray[i];

        let columns = line.split(" ");
        let prefix = columns[0];

        if (prefix === "newmtl") {
            if(currentMaterial !== null) materials.push(currentMaterial);
            currentMaterial = new Material();
            currentMaterial.name = columns[1];

        } else if (prefix === "Ns") {
           currentMaterial.shininess = parseFloat(columns[1]);

        } else if (prefix === "Ka") {
            currentMaterial.ambient = [parseFloat(columns[1]), parseFloat(columns[2]), parseFloat(columns[3])];
        } else if(prefix === "Kd")
        {
            currentMaterial.diffuse = [parseFloat(columns[1]), parseFloat(columns[2]), parseFloat(columns[3])];
        }else if(prefix === "Ks")
        {
            currentMaterial.specular = [parseFloat(columns[1]), parseFloat(columns[2]), parseFloat(columns[3])];
        }else if(prefix === "Ke")
        {
            currentMaterial.emissive = [parseFloat(columns[1]), parseFloat(columns[2]), parseFloat(columns[3])];
        }else if(prefix === "Ni")
        {
            currentMaterial.opticalDensity = parseFloat(columns[1]);
        }else if(prefix === "d")
        {
            currentMaterial.opacity = parseFloat(columns[1]);
        }else if(prefix === "illum")
        {
            currentMaterial.illum = parseFloat(columns[1]);
        }
    }

    if(currentMaterial !== null) materials.push(currentMaterial);

    return materials;
}

function calcFireflyPosition(i){
    const x = i.toFixed()/2000.;

    const buzzing = i%2===0?0.0005:0.;
    const sinus = Math.sin(x*1000.)/1000.;

    return [x, 1.0 + x + buzzing + sinus, -2.0]
}

function calcFireflyPosition2(i){
    const x = i.toFixed()/1000.;

    const buzzing = i%2===0?0.0006:0.;
    const sinus = Math.cos(x*1000.)/1000.;

    return [x - 0.4, 1.0 + x + buzzing + sinus, -2.0]
}