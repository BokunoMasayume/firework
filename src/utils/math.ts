function calcPos(x: number, y: number): number {
    return y * 4 + x;
}

export function matrixMultiply(a: Float32Array, b: Float32Array, dst?: Float32Array) {
    const res = dst ?? new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            res[calcPos(i, j)] = 0;
            for (let k = 0; k < 4; k++) {
                res[calcPos(i, j)] += a[calcPos(i, k)] * b[calcPos(k, j)];
            }
        }
    }
    return res;
}

export function vectorLength(v: Float32Array) {
    const num = v.length;
    let length = 0;
    for (let i = 0; i < num; i++) {
        length += v[i] * v[i];
    }
    return Math.sqrt(length);
}

export function copyMatrix(src: Float32Array, dst?: Float32Array): Float32Array {
    dst = dst ?? new Float32Array(16);

    dst[0] = src[0];
    dst[1] = src[1];
    dst[2] = src[2];
    dst[3] = src[3];
    dst[4] = src[4];
    dst[5] = src[5];
    dst[6] = src[6];
    dst[7] = src[7];
    dst[8] = src[8];
    dst[9] = src[9];
    dst[10] = src[10];
    dst[11] = src[11];
    dst[12] = src[12];
    dst[13] = src[13];
    dst[14] = src[14];
    dst[15] = src[15];

    return dst;
}

/**
     * 纯旋转矩阵转四元数
     * references:
     * https://zhuanlan.zhihu.com/p/45404840
     * http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
     * 精髓是一个项用trace(迹)表示， 其他三个项用矩阵的两个项和前面用迹表示的项一起表示
     *
     * @param m
     * @param dst 【x, y, z, w】
     */
export function quatFromRotationMatrix(m: Float32Array, dst:Float32Array = new Float32Array(16)) {
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const m11 = m[0];
    const m12 = m[4];
    const m13 = m[8];
    const m21 = m[1];
    const m22 = m[5];
    const m23 = m[9];
    const m31 = m[2];
    const m32 = m[6];
    const m33 = m[10];

    const trace = m11 + m22 + m33;

    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1);
        dst[3] = 0.25 / s;
        dst[0] = (m32 - m23) * s;
        dst[1] = (m13 - m31) * s;
        dst[2] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
        dst[3] = (m32 - m23) / s;
        dst[0] = 0.25 * s;
        dst[1] = (m12 + m21) / s;
        dst[2] = (m13 + m31) / s;
    } else if (m22 > m33) {
        const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
        dst[3] = (m13 - m31) / s;
        dst[0] = (m12 + m21) / s;
        dst[1] = 0.25 * s;
        dst[2] = (m23 + m32) / s;
    } else {
        const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
        dst[3] = (m21 - m12) / s;
        dst[0] = (m13 + m31) / s;
        dst[1] = (m23 + m32) / s;
        dst[2] = 0.25 * s;
    }

    return dst;
}

export function getAxisQuat(n: number, axis: 'x'|'y'|'z', dst: Float32Array = new Float32Array(4)) {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = Math.cos(n / 2);

    switch (axis) {
        case 'y':
            dst[1] = Math.sin(n / 2);
            break;
        case 'z':
            dst[2] = Math.sin(n / 2);
            break;
        default:
            dst[0] = Math.sin(n / 2);
            break;
    }
    return dst;
}

export function quatMultiply(p: Float32Array, q: Float32Array, dst: Float32Array = new Float32Array(4)) {
    dst[0] = p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1];
    dst[1] = p[3] * q[1] - p[0] * q[2] + p[1] * q[3] + p[2] * q[0];
    dst[2] = p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3];
    dst[3] = p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2];
    return dst;
}

export function quatFromEuler(x: number, y: number, z: number, dst: Float32Array = new Float32Array(4)) {

    const xq = getAxisQuat(x, 'x');
    const yq = getAxisQuat(y, 'y');
    const zq = getAxisQuat(z, 'z');

    quatMultiply(
        xq,
        quatMultiply(yq, zq),
        dst
    );

    return dst;
}

export function matrixDeterminate(m: Float32Array): number {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;

    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    return 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
}

export function composeMatrix(translation: ArrayLike<number>, quaternion: ArrayLike<number>, scale: ArrayLike<number>, dst?: Float32Array) {
    dst = dst ?? new Float32Array(16) ;
    const x = quaternion[0];
    const y = quaternion[1];
    const z = quaternion[2];
    const w = quaternion[3];

    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;

    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;

    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;

    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    const sx = scale[0];
    const sy = scale[1];
    const sz = scale[2];

    dst[0] = (1 - (yy + zz)) * sx;
    dst[1] = (xy + wz) * sx;
    dst[2] = (xz - wy) * sx;
    dst[3] = 0;

    dst[4] = (xy - wz) * sy;
    dst[5] = (1 - (xx + zz)) * sy;
    dst[6] = (yz + wx) * sy;
    dst[7] = 0;

    dst[8] = (xz + wy) * sz;
    dst[9] = (yz - wx) * sz;
    dst[10] = (1 - (xx + yy)) * sz;
    dst[11] = 0;

    dst[12] = translation[0];
    dst[13] = translation[1];
    dst[14] = translation[2];
    dst[15] = 1;

    return dst;
}

export function decomposeMatrix(
    mat: Float32Array,
    translation: Float32Array,
    quaternion: Float32Array,
    scale: Float32Array,
) {
    let sx = vectorLength(mat.slice(0, 3));
    const sy = vectorLength(mat.slice(4, 7));
    const sz = vectorLength(mat.slice(8, 11));

    // if determinate is negative, we need to invert one scale
    const det = matrixDeterminate(mat);
    if (det < 0) {
        sx = -sx;
    }

    translation[0] = mat[12];
    translation[1] = mat[13];
    translation[2] = mat[14];

    // scale the rotation part
    const matrix = copyMatrix(mat);

    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    matrix[0] *= invSX;
    matrix[1] *= invSX;
    matrix[2] *= invSX;

    matrix[4] *= invSY;
    matrix[5] *= invSY;
    matrix[6] *= invSY;

    matrix[8] *= invSZ;
    matrix[9] *= invSZ;
    matrix[10] *= invSZ;

    quatFromRotationMatrix(matrix, quaternion);

    scale[0] = sx;
    scale[1] = sy;
    scale[2] = sz;
}

/**
     * 求逆矩阵
     * references
     * https://semath.info/src/inverse-cofactor-ex4.html
     * https://blog.csdn.net/XY1790026787/article/details/106144101
     * @param m
     * @param dst
     * @returns
     */
export function inverse(m: Float32Array, dst?:Float32Array): Float32Array {
    dst = dst ?? new Float32Array(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;

    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return dst;
}