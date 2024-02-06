import { WebGLContext, createProgram, createShader } from "../../utils/webgl";
import vert from './shader/simple.vert';
import frag from './shader/simple.frag';
export class DemoParticle {

    canvas: HTMLCanvasElement;
    gl: WebGLContext;

    ratio = 2;

    program!: WebGLProgram;

    constructor(can: HTMLCanvasElement) {
        this.canvas = can;
        can.width = can.clientWidth * this.ratio;
        can.height = can.clientHeight * this.ratio;

        const gl = this.canvas.getContext('webgl2');

        if (!gl) {
            throw new Error('[DemoParticle init] 不支持webgl2');
        }

        this.gl = gl;

        this.initProgram();

        this.initVao();
        this.render();
    }

    initProgram() {
        const { gl } = this;
        
        try {
            this.program = createProgram(
                gl,
                createShader(gl, gl.VERTEX_SHADER, vert),
                createShader(gl, gl.FRAGMENT_SHADER, frag),
            )!;
            gl.useProgram(this.program);
        } catch(e){}
    }

    initVao() {
        const {gl} = this;

        const va = gl.createVertexArray();
        gl.bindVertexArray(va);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

    }


    render = () => {
        // this.gl.clearColor(1., 0., 1., 1.);
        // this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        const { gl } = this;
        // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
        // gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);


        requestAnimationFrame(this.render);
    }
}