import { WebGLContext, createProgram, createShader, getParameters } from "../../utils/webgl";
import vert from './shader/simple.vert';
import frag from './shader/simple.frag';
import transformFeedbackVert from './shader/updatePosition.vert';
import transformFeedbackFrag from './shader/updatePosition.frag';

const NumParticles = 100;
export class DemoParticle {

    canvas: HTMLCanvasElement;
    gl: WebGLContext;

    ratio = 2;

    transformProgram!: WebGLProgram;
    transformParameters!: ReturnType<typeof getParameters>;

    renderProgram!: WebGLProgram;
    renderParameters!: ReturnType<typeof getParameters>;

    position1Buffer!: WebGLBuffer;
    position2Buffer!: WebGLBuffer;

    transform1Va!: WebGLVertexArrayObject;
    transform2Va!: WebGLVertexArrayObject;
    render1Va!: WebGLVertexArrayObject;
    render2Va!: WebGLVertexArrayObject;

    tf1!: WebGLTransformFeedback;
    tf2!: WebGLTransformFeedback;

    time?: number;
    renderIdx = 0;

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
        this.initBuffers();
        this.initTransformFeedback();

        // this.initVao();
        this.render();
    }

    initProgram() {
        const { gl } = this;
        
        this.renderProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, vert),
            createShader(gl, gl.FRAGMENT_SHADER, frag),
        )!;
        this.renderParameters = getParameters(gl, this.renderProgram);

        this.transformProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, transformFeedbackVert),
            createShader(gl, gl.FRAGMENT_SHADER, transformFeedbackFrag),
            ["newPosition"]
        )!;
        this.transformParameters = getParameters(gl, this.transformProgram);
        // gl.useProgram(this.program);
    }

    initBuffers() {
        const {gl} = this;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 数据初始化 & buffer初始化
        const positions = new Float32Array(
            new Array(NumParticles).fill(0).map((_) => {
                return [
                    Math.random() * width,
                    Math.random() * height
                ]
            }).flat()
        );

        const position1Buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, position1Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        this.position1Buffer = position1Buffer;
        
        const position2Buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, position2Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        this.position2Buffer = position2Buffer;

        const velocities = new Float32Array(
            new Array(NumParticles).fill(0).map((_) => {
                return [
                    Math.random() * 300 - 150,
                    Math.random() * 300 - 150
                ]
            }).flat()
        );

        console.log(positions, velocities);

        const velocityBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW);


        // 编辑预设1
        const transform1Va = gl.createVertexArray();
        gl.bindVertexArray(transform1Va);
        this.transform1Va = transform1Va!;

        gl.bindBuffer(gl.ARRAY_BUFFER, position1Buffer);
        gl.vertexAttribPointer(
            this.transformParameters.oldPosition as number,
            2,
            gl.FLOAT,
            false,
            0, 0
        );
        gl.enableVertexAttribArray(this.transformParameters.oldPosition as number);
        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
        gl.vertexAttribPointer(
            this.transformParameters.velocity as number,
            2, 
            gl.FLOAT,
            false, 
            0, 0
        );
        gl.enableVertexAttribArray(this.transformParameters.velocity as number);
        // 编辑预设2
        const transform2Va = gl.createVertexArray()!;
        gl.bindVertexArray(transform2Va);
        this.transform2Va = transform2Va;

        gl.bindBuffer(gl.ARRAY_BUFFER, position2Buffer);
        gl.vertexAttribPointer(
            this.transformParameters.oldPosition as number,
            2,
            gl.FLOAT,
            false,
            0, 0
        );
        gl.enableVertexAttribArray(this.transformParameters.oldPosition as number);
        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
        gl.vertexAttribPointer(
            this.transformParameters.velocity as number,
            2, 
            gl.FLOAT,
            false, 
            0, 0
        );
        gl.enableVertexAttribArray(this.transformParameters.velocity as number);
        // 编辑预设3
        const render1Va = gl.createVertexArray()!;
        gl.bindVertexArray(render1Va);
        this.render1Va = render1Va;

        gl.bindBuffer(gl.ARRAY_BUFFER, position2Buffer);
        gl.vertexAttribPointer(
            this.transformParameters.oldPosition as number,
            2,
            gl.FLOAT,
            false,
            0, 0
        );
        gl.enableVertexAttribArray(this.renderParameters.position as number);
        // 编辑预设4
        const render2Va = gl.createVertexArray()!;
        gl.bindVertexArray(render2Va);
        this.render2Va = render2Va;

        gl.bindBuffer(gl.ARRAY_BUFFER, position1Buffer);
        gl.vertexAttribPointer(
            this.transformParameters.oldPosition as number,
            2,
            gl.FLOAT,
            false,
            0, 0
        );


        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    initTransformFeedback() {
        const { gl } = this;
        const tf1 = gl.createTransformFeedback()!;
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf1);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.position2Buffer);
        this.tf1 = tf1;

        const tf2 = gl.createTransformFeedback()!;
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf2);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.position1Buffer);
        this.tf2 = tf2;

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    }

    // initVao() {
    //     const {gl} = this;

    //     const va = gl.createVertexArray();
    //     gl.bindVertexArray(va);

    //     gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
    //     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(0);

    // }


    render = () => {
        const now = Date.now();
        if (!this.time) {
            this.time = now;
        }

        const delta = (now - this.time) / 1000;
        const { gl } = this;
        // gl.clearColor(0., 0., 0., .2);
        gl.clear(this.gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.transformProgram);
        if (this.renderIdx === 0) {
            gl.bindVertexArray(this.transform1Va);
        } else {
            gl.bindVertexArray(this.transform2Va);
        }

        gl.uniform2f(this.transformParameters.canvasDimensions, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.transformParameters.deltaTime, delta);

        gl.enable(gl.RASTERIZER_DISCARD);

        if (this.renderIdx === 0) {
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf1);
        } else {
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf2);
        }

        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, NumParticles);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        gl.disable(gl.RASTERIZER_DISCARD);

        gl.useProgram(this.renderProgram);
        if (this.renderIdx === 0) {
            gl.bindVertexArray(this.render1Va);
        } else {
            gl.bindVertexArray(this.render2Va);
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniformMatrix4fv(
            this.renderParameters.matrix,
            false,
            new Float32Array([
                2 / gl.canvas.width, 0, 0, 0,
                0, 2 / gl.canvas.height, 0, 0,
                0, 0, 1, 0,
                -1, -1, 0, 1
            ])
        );
        gl.drawArrays(gl.POINTS, 0, NumParticles);
        gl.bindVertexArray(null);

        this.renderIdx = (this.renderIdx + 1) % 2;
        this.time = now;

        requestAnimationFrame(this.render);
    }
}