function getExampleMatrix(matrix) {
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 5;
    matrix[3] = 2;
    matrix[4] = 1;
    matrix[5] = 6;
    matrix[6] = 3;
    matrix[7] = 4;
    matrix[8] = 0;
}


function getDeterminante3x3(matrix) {

    const a11 = matrix[0];
    const a12 = matrix[3];
    const a13 = matrix[6];

    const a21 = matrix[1];
    const a22 = matrix[4];
    const a23 = matrix[7];

    const a31 = matrix[2];
    const a32 = matrix[5];
    const a33 = matrix[8];

    return a11 * a22 * a33 + a12 * a23 * a31 + a13 * a21 * a32 - a31 * a22 * a13 - a32 * a23 * a11 - a33 * a21 * a12;
}

function swap(matrix, index1, index2) {
    const cache = matrix[index1];
    matrix[index1] = matrix[index2];
    matrix[index2] = cache;
}

function transpose(matrix) {
    swap(matrix, 1, 3);
    swap(matrix, 2, 6);
    swap(matrix, 5, 7);
}

function getDeterminante2x2(matrix) {
    const a11 = matrix[0];
    const a21 = matrix[1];
    const a12 = matrix[2];
    const a22 = matrix[3];

    return a11 * a22 - a21 * a12;
}


function getMinorMatrix(matrix, index) {
    if (index === 0) {
        return [matrix[4], matrix[5], matrix[7], matrix[8]]
    }

    if (index === 1) {
        return [matrix[3], matrix[5], matrix[6], matrix[8]]
    }

    if (index === 2) {
        return [matrix[3], matrix[4], matrix[6], matrix[7]]
    }

    if (index === 3) {
        return [matrix[1], matrix[2], matrix[7], matrix[8]]
    }

    if (index === 4) {
        return [matrix[0], matrix[2], matrix[6], matrix[8]]
    }

    if (index === 5) {
        return [matrix[0], matrix[1], matrix[6], matrix[7]]
    }

    if (index === 6) {
        return [matrix[1], matrix[2], matrix[4], matrix[5]]
    }

    if (index === 7) {
        return [matrix[0], matrix[2], matrix[3], matrix[5]]
    }

    if (index === 8) {
        return [matrix[0], matrix[1], matrix[3], matrix[4]]
    }
}

function getAdjugateMatrix(matrix) {
    const a11 = getDeterminante2x2(getMinorMatrix(matrix, 0));
    const a12 = getDeterminante2x2(getMinorMatrix(matrix, 1)) * -1;
    const a13 = getDeterminante2x2(getMinorMatrix(matrix, 2));
    const a21 = getDeterminante2x2(getMinorMatrix(matrix, 3)) * -1;
    const a22 = getDeterminante2x2(getMinorMatrix(matrix, 4));
    const a23 = getDeterminante2x2(getMinorMatrix(matrix, 5)) * -1;
    const a31 = getDeterminante2x2(getMinorMatrix(matrix, 6));
    const a32 = getDeterminante2x2(getMinorMatrix(matrix, 7)) * -1;
    const a33 = getDeterminante2x2(getMinorMatrix(matrix, 8));

    return [a11, a12, a13, a21, a22, a23, a31, a32, a33];
}

function invert(matrix, adjugateMatrix) {
    for (let i = 0; i < matrix.length; i++) {
        matrix[i] *= adjugateMatrix[i];
    }
}

function translate(out, a, v) {

    for (let i = 0; i < a.length; i++) {
        out[i] = a[i];
    }

    let x = v[0];
    let y = v[1];
    let z = v[2];

    let origin = [out[12], out[13], out[14], out[15]];

    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
}

function scale(out, input, v) {
    out[0] = input[0] * v[0];
    out[1] = input[1] * v[0];
    out[2] = input[2] * v[0];
    out[3] = input[3] * v[0];

    out[4] = input[4] * v[1];
    out[5] = input[5] * v[1];
    out[6] = input[6] * v[1];
    out[7] = input[7] * v[1];

    out[8] = input[8] * v[2];
    out[9] = input[9] * v[2];
    out[10] = input[10] * v[2];
    out[11] = input[11] * v[2];
}

function rotateY(out, a, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];

    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];


    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
}

function rotateX(out, input, rad) {
    out[0] = input[0];
    out[1] = input[1];
    out[2] = input[2];
    out[3] = input[3];
    out[4] = input[4] * Math.cos(rad) + input[8] * Math.sin(rad);
    out[5] = input[5] * Math.cos(rad) + input[9] * Math.sin(rad);
    out[6] = input[6] * Math.cos(rad) + input[10] * Math.sin(rad);
    out[7] = input[7] * Math.cos(rad) + input[11] * Math.sin(rad);
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

function perspective(out, fovy, aspect, near, far) {

    identity(out);

    let n = near;
    let f = far;

    let t = Math.tan(fovy / 2) * near;
    let b = -t;

    let r = t * aspect;
    let l = -r;

    out[0] = 2 / (r - l);
    out[5] = 2 / (t - b);
    out[8] = (1 / n) * ((r + l) / (r - l));
    out[9] = (1 / n) * ((t + b) / (t - b));
    out[10] = -(1 / n) * ((f + n) / (f - n));
    out[11] = -(1 / n);
    out[14] = -(2 * f / (f - n));
    out[15] = 0;
}

function kreuzprodukt(out, a, b) {
    out[0] = a[1] * b[2] - a[2] * b[1];
    out[1] = a[2] * b[0] - a[0] * b[2];
    out[2] = a[0] * b[1] - a[1] * b[0];
}

function lookAt(out, eye, center, up) {
    // eye - center
    let n = [eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]
    let n_betrag = Math.hypot(n[0], n[1], n[2]);

    // n x up
    let u = [];
    kreuzprodukt(u, up, n);
    let u_betrag = Math.hypot(u[0], u[1], u[2]);

    // n x u
    let v = [];
    kreuzprodukt(v, n, u);
    let v_betrag = Math.hypot(v[0], v[1], v[2]);


    let n_norm = [n[0] / n_betrag, n[1] / n_betrag, n[2] / n_betrag];
    let u_norm = [u[0] / u_betrag, u[1] / u_betrag, u[2] / u_betrag];
    let v_norm = [v[0] / v_betrag, v[1] / v_betrag, v[2] / v_betrag];

    out[0] = u_norm[0];
    out[1] = v_norm[0];
    out[2] = n_norm[0];
    out[3] = 0;

    out[4] = u_norm[1];
    out[5] = v_norm[1];
    out[6] = n_norm[1];
    out[7] = 0;

    out[8] = u_norm[2];
    out[9] = v_norm[2];
    out[10] = n_norm[2];
    out[11] = 0;

    out[12] = -(u_norm[0] * eye[0] + u_norm[1] * eye[1] + u_norm[2] * eye[2]);
    out[13] = -(v_norm[0] * eye[0] + v_norm[1] * eye[1] + v_norm[2] * eye[2]);
    out[14] = -(n_norm[0] * eye[0] + n_norm[1] * eye[1] + n_norm[2] * eye[2]);
    out[15] = 1;
}

function identity(out) {
    for (let i = 0; i < 16; i++) {
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

