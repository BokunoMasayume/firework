import { WebGLContext } from "../../utils/webgl";

export class Plane {
    gl: WebGLContext;

    va: WebGLVertexArrayObject;

    width = 100;
    height = 100;

    density = 1;



    constructor(gl: WebGLContext) {
        this.gl = gl;


    }

    createVa(position: Float32Array, uv: Float32Array, index: Uint16Array) {
        const { gl } = this;

        const va = gl.createVertexArray();

        gl.bindVertexArray(va);

        const positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(
            0,
            3,
            gl.FLOAT,
            false,
            0, 0
        );

        const uvBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(
            1,
            2, 
            gl.FLOAT,
            false,
            0, 0
        );

        const indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return va!;
    }

    createAttributes() {
        const { width, height, density } = this;
        const numX = Math.ceil(width * density ) + 1;
        const numY = Math.ceil(height * density ) + 1;
        const position = new Float32Array(numX * numY * 3);
        const uv = new Float32Array(numX * numY * 2);
        const index = new Uint16Array((numX - 1) * (numY -1) * 6 );

        const intervalX = width / (numX - 1);
        const intervalY = height / (numY - 1);

        
    }
}