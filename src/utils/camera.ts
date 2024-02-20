import { matrixMultiply } from "./math";
import { Transform } from "./transform";


// orthographic camera
export class Camera extends Transform {

    width: number;
    height: number;
    near: number;
    far: number;

    projectionMatrix: Float32Array = new Float32Array(16);

    private iViewProjectionMatrix: Float32Array = new Float32Array(16);

    get viewProjectionMatrix() {
        const inv = this.getInverse();
        matrixMultiply(this.projectionMatrix, inv, this.iViewProjectionMatrix);
        return this.iViewProjectionMatrix;
    }

    constructor(width = 10, height = 10, near = 0.1, far = 10) {
        super();
        this.width = width;
        this.height = height;
        this.near = near;
        this.far = far;

        this.calcProjectionMatrix();
    }

    calcProjectionMatrix() {
        this.projectionMatrix[0] = 2 / this.width;
        this.projectionMatrix[1] = 0;
        this.projectionMatrix[2] = 0;
        this.projectionMatrix[3] = 0;

        this.projectionMatrix[4] = 0;
        this.projectionMatrix[5] = 2 / this.height;
        this.projectionMatrix[6] = 0;
        this.projectionMatrix[7] = 0;

        this.projectionMatrix[8] = 0;
        this.projectionMatrix[9] = 0;
        this.projectionMatrix[10] = -2 / (this.far - this.near);
        this.projectionMatrix[11] = 0;

        this.projectionMatrix[12] = 0;
        this.projectionMatrix[13] = 0;
        this.projectionMatrix[14] =  - (this.far + this.near) / (this.far - this.near);
        this.projectionMatrix[15] = 1;

        return this.projectionMatrix;
    }

    

    
}