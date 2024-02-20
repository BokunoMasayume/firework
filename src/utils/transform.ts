import { composeMatrix, inverse, quatFromEuler } from "./math";

export class Transform {

    private iMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    private iDirty = false;

    private iTranslation = new Float32Array([0, 0, 0]);
    private iRotation = new Float32Array([0, 0, 0, 1]);
    private iEulerRotation = new Float32Array([0, 0, 0]);
    private iScale = new Float32Array([1, 1, 1]);

    get matrix() {
        if (this.iDirty) {
            composeMatrix(this.iTranslation, this.iRotation, this.iScale, this.iMatrix);
            this.iDirty = false;
        }
        return this.iMatrix;
    }

    get translation() {
        return this.iTranslation;
    }

    get rotation() {
        return this.iRotation;
    }

    get scale() {
        return this.iScale;
    }

    // components of translation
    get x() {
        return this.iTranslation[0];
    }

    set x(n: number) {
        if (n !== this.iTranslation[0]) {
            this.iTranslation[0] = n;
            this.iDirty = true;
        }
    }

    get y() {
        return this.iTranslation[1];
    }

    set y(n: number) {
        if (n !== this.iTranslation[1]) {
            this.iTranslation[1] = n;
            this.iDirty = true;
        }
    }

    get z() {
        return this.iTranslation[2];
    }

    set z(n: number) {
        if (n !== this.iTranslation[2]) {
            this.iTranslation[2] = n;
            this.iDirty = true;
        }
    }

    // components of scale
    get sx() {
        return this.iScale[0];
    }

    set sx(n: number) {
        if (n !== this.iScale[0]) {
            this.iScale[0] = n;
            this.iDirty = true;
        }
    }

    get sy() {
        return this.iScale[1];
    }

    set sy(n: number) {
        if (n !== this.iScale[1]) {
            this.iScale[1] = n;
            this.iDirty = true;
        }
    }

    get sz() {
        return this.iScale[2];
    }

    set sz(n: number) {
        if (n !== this.iScale[2]) {
            this.iScale[2] = n;
            this.iDirty = true;
        }
    }

    set s3(n: number) {
        this.sx = n;
        this.sy = n;
        this.sz = n;
    }

    // components of rotation , radius
    get rx() {
        return this.iEulerRotation[0];
    }

    set rx(n: number) {
        if (n !== this.iEulerRotation[0]) {
            this.iEulerRotation[0] = n;
            quatFromEuler(...(this.iEulerRotation as unknown as [number, number, number]), this.iRotation);
            this.iDirty = true;
        }
    }

    get ry() {
        return this.iEulerRotation[1];
    }

    set ry(n: number) {
        if (n !== this.iEulerRotation[1]) {
            this.iEulerRotation[1] = n;
            quatFromEuler(...(this.iEulerRotation as unknown as [number, number, number]), this.iRotation);
            this.iDirty = true;
        }
    }

    get rz() {
        return this.iEulerRotation[2];
    }

    set rz(n: number) {
        if (n !== this.iEulerRotation[2]) {
            this.iEulerRotation[2] = n;
            quatFromEuler(...(this.iEulerRotation as unknown as [number, number, number]), this.iRotation);
            this.iDirty = true;
        }
    }

    constructor() {

    }

    getInverse() {
        return inverse(this.matrix);
    }
}