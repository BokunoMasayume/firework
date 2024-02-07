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