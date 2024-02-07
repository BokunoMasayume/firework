import { BufferState, TransformFeedbackState } from "../../types/transformFeedback";
import { WebGLContext, createProgram, createShader, getParameters } from "../../utils/webgl";

import initTransVert from './shader/initTransformFeedback/initTrans.vert';
import initTransFrag from './shader/initTransformFeedback/initTrans.frag';
import transVert from './shader/iterationTransformFeedback/iterTrans.vert';
import transFrag from './shader/iterationTransformFeedback/iterTrans.frag';
import renderVert from './shader/render/render.vert';
import renderFrag from './shader/render/render.frag';
import { loadImage } from "../../utils/loadImg";
import { composeMatrix, matrixMultiply } from "../../utils/math";

export class PictureFirework {
    gl: WebGLContext;

    picUrl: string;
    texture!: WebGLTexture;

    showWidth: number;
    showHeight: number;

    // 每像素有几个粒子
    density: number = 0.1;

    numParticle = 0;

    startTime!: number;
    prevTime!: number;

    transformProgram: WebGLProgram | null = null;
    transformParameters?: ReturnType<typeof getParameters>;

    renderProgram: WebGLProgram | null = null;
    renderParameters?: ReturnType<typeof getParameters>;

    currentState!: TransformFeedbackState & {idx: number};
    nextState!: TransformFeedbackState & {idx: number};

    matrix?: Float32Array;

    constructor(gl: WebGLContext, url: string) {
        this.gl = gl;
        this.picUrl = url;
        // TODO 
        this.showWidth = gl.canvas.width;
        this.showHeight = gl.canvas.height;
    }

    async init() {
        const { gl } = this;
        const { initTransParameters, initTransProgram } = this.initProgram();
        const { positionBuffers, velocityAndSizeBuffers, colorBuffers } = this.initBuffers();

        const createState = (idx = 0) => {
            const current = idx;
            const next = (current +1) % 2;

            return {
                idx,
                transformVa: this.createVaState([{
                    buffer: positionBuffers[current]!,
                    location: this.transformParameters!.oldPosition as number,
                    numComponent: 3
                }, {
                    buffer: colorBuffers[current]!,
                    location: this.transformParameters!.oldColor as number,
                    numComponent: 4,
                }, {
                    buffer: velocityAndSizeBuffers[current]!,
                    location: this.transformParameters!.oldVelocityAndSize as number,
                    numComponent: 4,
                }])!,
                renderVa: this.createVaState([
                    {
                        buffer: positionBuffers[next]!,
                        location: this.renderParameters!.position as number,
                        numComponent: 3,
                    }, {
                        buffer: colorBuffers[next]!,
                        location: this.renderParameters!.color as number,
                        numComponent: 4,
                    }, {
                        buffer: velocityAndSizeBuffers[next]!,
                        location: this.renderParameters!.velocityAndSize as number,
                        numComponent: 4,
                    }
                ])!,
                tf: this.createTfState([
                    positionBuffers[next]!,
                    colorBuffers[next]!,
                    velocityAndSizeBuffers[next]!
                ]),
            }
        }
        this.currentState = createState(0);
        this.nextState = createState(1);

        gl.useProgram(initTransProgram);

        // init buffer by initTransformFeedback
        const initVa = this.createVaState([
            {
                buffer: positionBuffers[1]!,
                location: initTransParameters!.initPosition as number,
                numComponent: 3
            }
        ]);
        const initTf = this.createTfState([
            positionBuffers[0]!,
            colorBuffers[0]!,
            velocityAndSizeBuffers[0]!
        ])
        // const initTf = this.nextState.tf;

        gl.bindVertexArray(initVa);

        // uniform sampler2D colorMap;
        gl.uniform2f(initTransParameters!.dimensions, this.showWidth, this.showHeight);
        gl.uniform1i(initTransParameters!.colorMap, 0);
        await this.initTexture();
        
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, initTf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindVertexArray(null);


    }

    render = () => {
        const { gl } = this;
        const now = Date.now();
        if (!this.startTime || !this.prevTime) {
            this.startTime = now;
            this.prevTime = now;
        }

        const delta = (now - this.prevTime) / 1000;
        const currentTime = (now - this.startTime) / 1000;

        gl.useProgram(this.transformProgram);
        gl.bindVertexArray(this.currentState.transformVa);
        gl.uniform1f(this.transformParameters!.deltaTime, delta);
        gl.uniform1f(this.transformParameters!.currentTime, currentTime);


        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.currentState.tf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.useProgram(this.renderProgram);
        gl.bindVertexArray(this.currentState.renderVa);

        if (!this.matrix) {
            const clipMatrix = new Float32Array([
                2 / this.showWidth, 0, 0, 0,
                0, 2 / this.showHeight, 0, 0,
                0, 0, 1, 0,
                -1, -1, 0, 1
            ]);
            const transformMatrix = composeMatrix(
                [0, 0.1, 0],
                [0, 0, 0, 1],
                [0.5, 0.5, 0.5]
            );
            
            this.matrix = matrixMultiply(transformMatrix, clipMatrix);
        }
        gl.uniformMatrix4fv(
            this.renderParameters!.matrix,
            false,
            this.matrix!
        );
        
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.bindVertexArray(null);

        this.prevTime = now;
        const temp = this.nextState;
        this.nextState = this.currentState;
        this.currentState = temp;

        requestAnimationFrame(this.render);
    }

    initProgram() {
        const { gl } = this;

        const initTransProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, initTransVert),
            createShader(gl, gl.FRAGMENT_SHADER, initTransFrag),
            ["position", "color", "velocityAndSize"]
        );

        if (!initTransProgram) {
            throw new Error(`[Firework] Failed to create program (pictureFirework)`);
        }
        const initTransParameters = getParameters(gl, initTransProgram);

        this.transformProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, transVert),
            createShader(gl, gl.FRAGMENT_SHADER, transFrag),
            ["position", "color", "velocityAndSize"]
        );
        if (!this.transformProgram) {
            throw new Error(`[Firework] Failed to create program (pictureFirework)`);
        }
        this.transformParameters = getParameters(gl, this.transformProgram);

        this.renderProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, renderVert),
            createShader(gl, gl.FRAGMENT_SHADER, renderFrag)
        );
        if (!this.renderProgram) {
            throw new Error(`[Firework] Failed to create program (pictureFirework)`);
        }
        this.renderParameters = getParameters(gl, this.renderProgram);


        return {
            initTransProgram,
            initTransParameters,
        }
    }

    initBuffers() {
        const { gl } = this;

        const sampleWidth = Math.floor(this.showWidth * this.density);
        const sampleHeight = Math.floor(this.showHeight * this.density);

        this.numParticle = sampleWidth * sampleHeight;

        const positions = new Float32Array(
            new Array(this.numParticle).fill(0).map((_, idx) => {
                const y = Math.floor(idx / sampleWidth);
                const x = idx - y * sampleWidth;
                return [
                    x / this.density,
                    y / this.density,
                    0
                ]
            }).flat()
        );

        const colors = new Float32Array(this.numParticle * 4);
        const velocityAndSize = new Float32Array(this.numParticle * 4);

        const positionBuffers = [this.initBuffer(positions), this.initBuffer(positions)];
        const colorBuffers = [this.initBuffer(colors), this.initBuffer(colors)];
        const velocityAndSizeBuffers = [this.initBuffer(velocityAndSize), this.initBuffer(velocityAndSize)];

        return {
            positionBuffers,
            colorBuffers,
            velocityAndSizeBuffers,
        }
    }

    async initTexture() {
        const { gl } = this;

        const img = await loadImage(this.picUrl);

        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.texture = texture;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        return texture;
    }

    private createVaState(states: BufferState[]) {
        const { gl } = this;
        const va = gl.createVertexArray();
        gl.bindVertexArray(va);

        states.forEach(state => {
            gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
            gl.vertexAttribPointer(
                state.location,
                state.numComponent,
                gl.FLOAT,
                false,
                0,
                0,
            );
            gl.enableVertexAttribArray(state.location);
        });

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return va;
    }

    private createTfState(buffers: WebGLBuffer[]) {
        const { gl } = this;

        const tf = gl.createTransformFeedback();

        if (!tf) {
            throw new Error(`[Firework] Failed to create TransformFeedback (pictureFirework)`);
        }

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

        buffers.forEach((buffer, idx) => {
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, idx, buffer);
        });

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return tf;
    }

    private initBuffer(data: Float32Array) {
        const { gl } = this;
        const buffer = gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        return buffer;
    }

    // 慎用, 似乎会和transform feedback冲突, 导致无法写入
    private readBuffer(buffer: WebGLBuffer, size: number) {
        const { gl } = this;
        const results = new Float32Array(size);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(
            gl.ARRAY_BUFFER,
            0,    // byte offset into GPU buffer,
            results,
        );
        return results;
    }

}