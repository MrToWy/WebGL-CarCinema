function translate(out, input, v) {
    for (let i = 0; i < 12 ; i++) {
        out[i] = input[i];
    }
    out[12] = input[0] * v[0] + input[4] * v[1] + input[8] * v[2] + input[12];
    out[13] = input[1] * v[0] + input[5] * v[1] + input[9] * v[2] + input[13];
    out[14] = input[2] * v[0] + input[6] * v[1] + input[10] * v[2] + input[14];
    out[15] = input[3] * v[0] + input[7] * v[1] + input[11] * v[2] + input[15];
}

function scale(out, input, v) {
    out[0] = input[0] * v[0];
    out[1] = input[1] * v[0];
    out[2] = input[2] * v[0];
    out[4] = input[4] * v[1];
    out[5] = input[5] * v[1];
    out[6] = input[6] * v[1];
    out[8] = input[8] * v[2];
    out[9] = input[9] * v[2];
    out[10] = input[10] * v[2];

    out[3] = input[3];
    out[7] = input[7];
    out[11] = input[11];

    for (let i = 12; i < 16 ; i++) {
        out[i] = input[i];
    }
}

function rotateY(out, input, rad) {
    const a0 = input[0];
    const a1 = input[1];
    const a2 = input[2];
    const a3 = input[3];
    const a8 = input[8];
    const a9 = input[9];
    const a10 = input[10];
    const a11 = input[11];


    out[0] = a0 * Math.cos(rad) - a8 * Math.sin(rad);
    out[1] = a1 * Math.cos(rad) - a9 * Math.sin(rad);
    out[2] = a2 * Math.cos(rad) - a10 * Math.sin(rad);
    out[3] = a3 * Math.cos(rad) - a11 * Math.sin(rad);
    out[4] = input[4];
    out[5] = input[5];
    out[6] = input[6];
    out[7] = input[7];
    out[8] = a0 * Math.sin(rad) + a8 * Math.cos(rad);
    out[9] = a1 * Math.sin(rad) + a9 * Math.cos(rad);
    out[10] = a2 * Math.sin(rad) + a10 * Math.cos(rad);
    out[11] = a3 * Math.sin(rad) + a11 * Math.cos(rad);
    out[12] = input[12];
    out[13] = input[13];
    out[14] = input[14];
    out[15] = input[15];
}

function rotateX(out, input, rad) {
    out[0] = input[0];
    out[1] = input[1];
    out[2] = input[2];
    out[3] = input[3];
    out[4] = input[4] * Math.cos(rad) + input[8] * Math.sin(rad);
    out[5] = input[5]* Math.cos(rad) + input[9] * Math.sin(rad);
    out[6] = input[6]* Math.cos(rad) + input[10] * Math.sin(rad);
    out[7] = input[7]* Math.cos(rad) + input[11] * Math.sin(rad);
    out[8] = input[4] * -Math.sin(rad) + input[8] * Math.cos(rad);
    out[9] = input[5] * -Math.sin(rad) + input[9] * Math.cos(rad);
    out[10] = input[6] * -Math.sin(rad) + input[10] * Math.cos(rad);
    out[11] = input[7] * -Math.sin(rad) + input[11] * Math.cos(rad);
    out[12] = input[12];
    out[13] = input[13];
    out[14] = input[14];
    out[15] = input[15];
}

function rotateZ(out, input, rad) {
    out[0] = input[0] * Math.cos(rad) + input[4] * Math.sin(rad);
    out[1] = input[1] * Math.cos(rad) + input[5] * Math.sin(rad);
    out[2] = input[2] * Math.cos(rad) + input[6] * Math.sin(rad);
    out[3] = input[3] * Math.cos(rad) + input[7] * Math.sin(rad);
    out[4] = input[0] * -Math.sin(rad) + input[4] * Math.cos(rad);
    out[5] = input[1] * -Math.sin(rad) + input[5] * Math.cos(rad);
    out[6] = input[2] * -Math.sin(rad) + input[6] * Math.cos(rad);
    out[7] = input[3] * -Math.sin(rad) + input[7] * Math.cos(rad);
    out[8] = input[8]
    out[9] = input[9];
    out[10] = input[10]
    out[11] = input[11]
    out[12] = input[12];
    out[13] = input[13];
    out[14] = input[14];
    out[15] = input[15];
}

function lookAt(out, eye, center, up) {
    var n = [];
    var nNorm = [];
    var u = [];
    var uNorm = [];
    var v = [];
    var vNorm = [];

    // Eye - Center
    n[0] = eye[0] - center[0];
    n[1] = eye[1] - center[1];
    n[2] = eye[2] - center[2];

    nNorm = [n[0] / Math.hypot(n[0],n[1],n[2]), n[1] / Math.hypot(n[0],n[1],n[2]), n[2] / Math.hypot(n[0],n[1],n[2])];

    // Up x n
    u[0] = up[1] * n[2] - up[2] * n[1];
    u[1] = up[2] * n[0] - up[0] * n[2];
    u[2] = up[0] * n[1] - up[1] * n[0];

    uNorm = [u[0] / Math.hypot(u[0],u[1],u[2]), u[1] / Math.hypot(u[0],u[1],u[2]), u[2] / Math.hypot(u[0],u[1],u[2])];

    // n x u
    v[0] = n[1] * u[2] - n[2] * u[1];
    v[1] = n[2] * u[0] - n[0] * u[2];
    v[2] = n[0] * u[1] - n[1] * u[0];

    vNorm = [v[0] / Math.hypot(v[0],v[1],v[2]), v[1] / Math.hypot(v[0],v[1],v[2]), v[2] / Math.hypot(v[0],v[1],v[2])];

    out[0] = uNorm[0];
    out[1] = vNorm[0];
    out[2] = nNorm[0];
    out[3] = 0
    out[4] = uNorm[1];
    out[5] = vNorm[1];
    out[6] = nNorm[1];
    out[7] = 0;
    out[8] = uNorm[2];
    out[9] = vNorm[2];
    out[10] = nNorm[2];
    out[11] = 0;
    out[12] = -uNorm[0] * eye[0] - uNorm[1] * eye[1] -uNorm[2] * eye[2];
    out[13] = -vNorm[0] * eye[0] - vNorm[1] * eye[1] -vNorm[2] * eye[2];
    out[14] = -nNorm[0] * eye[0] - nNorm[1] * eye[1] -nNorm[2] * eye[2];
    out[15] = 1;
}

function perspective(out, fovy, aspect, near, far) {
    var t = Math.tan(fovy/2)*near;
    var b = -t;
    var r = t * aspect;
    var l = -r;
    identity(out);
    out[0] = 2/(r-l);
    out[5] = 2/(t-b);
    out[8] = (1 / near) * ((r+l) / (r-l));
    out[9] = (1 / near) * ((t+b) / (t-b));
    out[10] = (-1 / near) * ((far + near) / (far-near));
    out[11] = -1 / near;
    out[14] = (-2 * far) / (far-near);
    out[15] = 0;
}

function determiante3x3(input) {
    var det = 0;
    const a11 = input[0];
    const a12 = input[3];
    const a13 = input[6];
    const a21 = input[1];
    const a22 = input[4];
    const a23 = input[7];
    const a31 = input[2];
    const a32 = input[5];
    const a33 = input[8];
    det = a11*a22*a33 + a12*a23*a31 + a13*a21*a32 - a31*a22*a13 - a32*a23*a11 - a33*a21*a12;
    return det;
}

function transpose(input){
    const a11 = input[0];
    const a21 = input[3];
    const a33 = input[8];
    const a12 = input[1];
    const a22 = input[4];
    const a13 = input[2];
    const a31 = input[6];
    const a23 = input[5];
    const a32 = input[7];

    const tran = [a11,a21,a31,a12,a22,a32,a13,a23,a33];
    return tran;
}

function adjunkten(input){
    const a11 = determinaten2x2([input[4],input[5],input[7],input[8]]);
    const a21 = determinaten2x2([input[3],input[5],input[6],input[8]]);
    const a31 = determinaten2x2([input[3],input[4],input[6],input[7]]);
    const a12 = determinaten2x2([input[1],input[2],input[7],input[8]]);
    const a22 = determinaten2x2([input[0],input[2],input[6],input[8]]);
    const a32 = determinaten2x2([input[0],input[1],input[6],input[7]]);
    const a13 = determinaten2x2([input[1],input[2],input[4],input[5]]);
    const a23 = determinaten2x2([input[0],input[2],input[3],input[5]]);
    const a33 = determinaten2x2([input[0],input[1],input[3],input[4]]);

    const mat = [a11,a21,a31,a12,a22,a32,a13,a23,a33];
    return mat;

}

function determinaten2x2(input) {
    const det = input[0] * input[3] - input[1] * input[2];
    return det;
}

function invert3x3(input) {
    const det = determiante3x3(input);
    const tran = transpose(input);
    const adj = adjunkten(tran);
    const inv = [];
    for (let i = 0; i < adj.length; i++) {
        if (i === 0 || i === 2 || i === 4 || i === 6 || i === 8) {
            inv.push(1 / det * adj[i]);
        } else {
            inv.push(-1 / det * adj[i]);
        }
    }
    return inv;
}

function normalFromMat4(out,input) {
    var mat3 = [];
    for (let i = 0; i < 11; i++) {
        if(i === 3 || i === 7 ){
            continue;
        } else {
            mat3.push(input[i]);
        }
    }
    const inv = invert3x3(mat3);
    const tran = transpose(inv);
    for (let i = 0; i < 16 ; i++) {
        out[i] = tran[i];
    }
}

function identity(out) {
    for (let i = 0; i < 16 ; i++) {
        out[i] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
}

function multiply(out, input1, input2) {
    out[0]  = input1[0] * input2[0] + input1[4] * input2[1] + input1[8] * input2[2] + input1[12] * input2[3];
    out[1]  = input1[1] * input2[0] + input1[5] * input2[1] + input1[9] * input2[2] + input1[13] * input2[3];
    out[2]  = input1[2] * input2[0] + input1[6] * input2[1] + input1[10] * input2[2] + input1[14] * input2[3];
    out[3]  = input1[3] * input2[0] + input1[7] * input2[1] + input1[11] * input2[2] + input1[15] * input2[3];
    out[4]  = input1[0] * input2[4] + input1[4] * input2[5] + input1[8] * input2[6] + input1[12] * input2[7];
    out[5]  = input1[1] * input2[4] + input1[5] * input2[5] + input1[9] * input2[6] + input1[13] * input2[7];
    out[6]  = input1[2] * input2[4] + input1[6] * input2[5] + input1[10] * input2[6] + input1[14] * input2[7];
    out[7]  = input1[3] * input2[4] + input1[7] * input2[5] + input1[11] * input2[6] + input1[15] * input2[7];
    out[8]  = input1[0] * input2[8] + input1[4] * input2[9] + input1[8] * input2[10] + input1[12] * input2[11];
    out[9]  = input1[1] * input2[8] + input1[5] * input2[9] + input1[9] * input2[10] + input1[13] * input2[11];
    out[10] = input1[2] * input2[8] + input1[6] * input2[9] + input1[10] * input2[10] + input1[14] * input2[11];
    out[11] = input1[3] * input2[8] + input1[7] * input2[9] + input1[11] * input2[10] + input1[15] * input2[11];
    out[12] = input1[0] * input2[12] + input1[4] * input2[13] + input1[8] * input2[14] + input1[12] * input2[15];
    out[13] = input1[1] * input2[12] + input1[5] * input2[13] + input1[9] * input2[14] + input1[13] * input2[15];
    out[14] = input1[2] * input2[12] + input1[6] * input2[13] + input1[10] * input2[14] + input1[14] * input2[15];
    out[15] = input1[3] * input2[12] + input1[7] * input2[13] + input1[11] * input2[14] + input1[15] * input2[15];
}

