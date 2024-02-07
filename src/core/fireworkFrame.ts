import { WebGLContext } from "../utils/webgl";

export class FireworkFrame {
    canvas: HTMLCanvasElement;
    gl: WebGLContext;

    ratio = 2;

    constructor(can: HTMLCanvasElement) {
        this.canvas = can;
        can.width = can.clientWidth * this.ratio;
        can.height = can.clientHeight * this.ratio;

        const gl = this.canvas.getContext('webgl2');

        if (!gl) {
            throw new Error('[DemoParticle init] 不支持webgl2');
        }

        this.gl = gl;

    }
}