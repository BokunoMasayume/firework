import { WebGLContext, createProgram, createShader, getParameters } from "../../utils/webgl";

import vert from './shader/demo.vert';
import frag from './shader/demo.frag';

export class DemoPostEffect {
    gl: WebGLContext;

    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    program: WebGLProgram;
    programParameters: any;
    va: WebGLVertexArrayObject;

    ratio = 1;

    width: number;
    height: number;

    constructor(gl: WebGLContext) {
        this.gl = gl;

        this.width = gl.canvas.width * this.ratio;
        this.height = gl.canvas.height * this.ratio;

        const fb = this.framebuffer = this.createFramebuffer();

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);

        const tex = this.texture = this.initTexture();

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.program = createProgram(
            gl, 
            createShader(gl, gl.VERTEX_SHADER, vert),
            createShader(gl, gl.FRAGMENT_SHADER, frag)
        )!;
        this.programParameters = getParameters(gl, this.program);


        this.va = this.createVa();
    }

    setViewport() {
        this.gl.viewport(0, 0, this.width, this.height);
    }

    createFramebuffer() {
        const fb = this.gl.createFramebuffer()!;
        return fb;
    }

    createVa() {
        const {gl, programParameters} = this;
        const position = new Float32Array([
            -1, -1, 0,
            -1, 1, 0,
            1, 1, 0,
            1, 1, 0,
            1, -1, 0,
            -1, -1, 0
        ]);
        const uv = new Float32Array([
            0, 0,
            0, 1,
            1, 1,
            1, 1,
            1, 0,
            0, 0
        ]);
        const va = gl.createVertexArray();
        gl.bindVertexArray(va);

        const positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(programParameters.position );
        gl.vertexAttribPointer(
            programParameters.position,
            3,
            gl.FLOAT,
            false,
            0, 0
        );

        const uvBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(programParameters.uv );
        gl.vertexAttribPointer(
            programParameters.uv,
            2,
            gl.FLOAT,
            false,
            0, 0
        );

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return va!;
        
    }

    // TODO 应该抽一个rhi
    initTexture() {
        const { gl } = this;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }


    render(fb: WebGLFramebuffer | null = null) {
        const { gl, program, programParameters, texture, va} = this;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        this.setViewport();


        gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(va);

        // uniforms
        gl.uniform1i(programParameters.map, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.uniform2f(programParameters.resolutionDivided, 7 / this.width, 7 / this.height);
        gl.uniform3f(programParameters.bloomColor, 1, 1, 1);
        gl.uniform1f(programParameters.bloomThread, 0.1);
        gl.uniform1f(programParameters.bloomWeight, 5);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

    }
}