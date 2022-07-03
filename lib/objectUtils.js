'use strict';

async function getVertices(gl, program, objPath){
    let request = await fetch(objPath);
    let boxText = await request.text();
    let vertices = objToVBO(boxText, program);

    await bindVerticesToBuffer(vertices);

    return vertices;
}

async function position(gl, program, objRotationAngle, translateVector3, scaleVector3, canvas, eye, look){
    gl.useProgram(program);
    let identityMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);
    let translateMatrix = new Float32Array(16);
    let scaleMatrix = new Float32Array(16);
    let rotateMatrix = new Float32Array(16);
    let normalMatrix = new Float32Array(9);
    let worldMatrix = new Float32Array(16);
    var inverseMat = new Float32Array(16);
    const camDir = new Float32Array(3);

    identity(identityMatrix);
    identity(viewMatrix);
    identity(projMatrix);
    identity(translateMatrix);
    identity(scaleMatrix);
    identity(rotateMatrix);
    identity(normalMatrix);
    identity(inverseMat);

    lookAt(viewMatrix, eye, look, [0, 1, 0]);

    if(objRotationAngle !== null){
        rotateX(rotateMatrix, rotateMatrix, objRotationAngle.x * Math.PI / 180);
        rotateY(rotateMatrix, rotateMatrix, objRotationAngle.y * Math.PI / 180);
        rotateZ(rotateMatrix, rotateMatrix, objRotationAngle.z * Math.PI / 180);
    }

    translate(translateMatrix, translateMatrix, translateVector3)
    scale(scaleMatrix, scaleMatrix, scaleVector3);

    perspective(projMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    multiply(worldMatrix, scaleMatrix,rotateMatrix);
    multiply(worldMatrix, worldMatrix,translateMatrix);
    normalFromMat4(normalMatrix, worldMatrix);

    inverseMat = mat3FromMat4(viewMatrix);
    inverseMat = invert3x3(inverseMat);
    vec3MulMat3(camDir, [0,0,1], inverseMat);

    setMat4Uniform(program,viewMatrix,'mView',gl);
    setMat4Uniform(program,projMatrix,'mProj',gl);
    setMat4Uniform(program,translateMatrix,'mTranslate',gl);
    setMat4Uniform(program,scaleMatrix,'mScale',gl);
    setMat4Uniform(program,rotateMatrix,'mRotate',gl);
    setMat3Uniform(program,normalMatrix,'mNormale',gl);
    setVec3Uniform(program,camDir,'camDir',gl);

}

function getSkyboxTexture(){
    const skyboxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
    let textureImage = document.getElementById("skybox")
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null);

    return skyboxTexture;
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


function setLighting(program, lightDir, ambiente, diffuse, specular, alpha, eye) {
    setVec3Uniform(program, lightDir,'lightDirection', gl);
    setVec3Uniform(program, ambiente, 'ambiente', gl);
    setVec3Uniform(program, diffuse, 'diffuse', gl);
    setVec3Uniform(program, specular, 'specular', gl);
    setVec3Uniform(program, eye,'eyeDir',gl);
    setFloatUniform(program, alpha, 'alpha', gl);
}

function objToVBO(objString) {

    let objArray = objString.split("\n");
    let v = [];
    let vt = [];
    let vn = [];
    let vbo = [];

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

                // push normals
                vbo.push(vn[normalIndex][0], vn[normalIndex][1], vn[normalIndex][2]);
            }
        }

    }

    return vbo;
}