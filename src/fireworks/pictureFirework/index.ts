import { BufferStatus, TransformFeedbackStatus } from "../../types/transformFeedback";
import { WebGLContext, createProgram, createShader, getParameters } from "../../utils/webgl";

import initTransVert from './shader/initTransformFeedback/initTrans.vert';
import initTransFrag from './shader/initTransformFeedback/initTrans.frag';
import transVert from './shader/iterationTransformFeedback/iterTrans.vert';
import transFrag from './shader/iterationTransformFeedback/iterTrans.frag';
import renderVert from './shader/render/render.vert';
import renderFrag from './shader/render/render.frag';
import { loadImage } from "../../utils/loadImg";
import { composeMatrix, matrixMultiply } from "../../utils/math";
import { FireWorkState } from "../../types/common";
import { BaseFirework } from "../base";
import { Transform } from "../../utils/transform";

export class PictureFirework extends BaseFirework{
    picUrl: string;
    texture!: WebGLTexture;

    showWidth: number;
    showHeight: number;

    wantedNumParticle = 2000;
    // 每像素有几个粒子
    private density: number = 0.02;

    numParticle = 0;

    transformProgram: WebGLProgram | null = null;
    transformParameters?: ReturnType<typeof getParameters>;

    renderProgram: WebGLProgram | null = null;
    renderParameters?: ReturnType<typeof getParameters>;

    currentStatus!: TransformFeedbackStatus;
    nextStatus!: TransformFeedbackStatus;

    matrix?: Float32Array;

    initPositions?: Float32Array;

    // particleTexture?: WebGLTexture;

    // 内部使用
    private initTransfromFeedbackStatus?: {
        initTransParameters: any;
        initTransProgram: WebGLProgram;

        initVa: WebGLVertexArrayObject;
        initTf: WebGLTransformFeedback;

        positionBuffers: WebGLBuffer[];
        velocityAndSizeBuffers: WebGLBuffer[];
        colorBuffers: WebGLBuffer[];
    };

    constructor(gl: WebGLContext, tex: WebGLTexture, url: string) {
        super(gl, tex);
        this.picUrl = url;
        // TODO 
        this.showWidth = gl.canvas.width;
        this.showHeight = this.showWidth;
        this.density = Math.sqrt(this.wantedNumParticle / ( this.showHeight * this.showWidth));

        this.transform.s3 = 0.2;

        this.transform.x = - this.showWidth / 2 * this.transform.sx;
        this.transform.y = - this.showHeight / 2 * this.transform.sy;
        
    }

    async init() {
        this.state = FireWorkState.Init;
        const { gl } = this;
        const { initTransParameters, initTransProgram } = this.initProgram();
        const { positionBuffers, velocityAndSizeBuffers, colorBuffers } = this.initBuffers();

        const createStatus = (idx = 0) => {
            const current = idx;
            const next = (current +1) % 2;

            return {
                id: idx,
                transformVa: this.createVaStatus([{
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
                renderVa: this.createVaStatus([
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
                tf: this.createTfStatus([
                    positionBuffers[next]!,
                    colorBuffers[next]!,
                    velocityAndSizeBuffers[next]!
                ]),
            }
        }
        this.currentStatus = createStatus(0);
        this.nextStatus = createStatus(1);

        // init buffer by initTransformFeedback
        const initVa = this.createVaStatus([
            {
                buffer: positionBuffers[1]!,
                location: initTransParameters!.initPosition as number,
                numComponent: 3
            }
        ])!;
        const initTf = this.createTfStatus([
            positionBuffers[0]!,
            colorBuffers[0]!,
            velocityAndSizeBuffers[0]!
        ])!;

        this.initTransfromFeedbackStatus = {
            initTransParameters,
            initTransProgram,
            initVa,
            initTf,

            positionBuffers,
            velocityAndSizeBuffers,
            colorBuffers,
        };

        await this.initTransformFeedback(false);

        this.state = FireWorkState.Idle;
    }

    start() {

        // if (this.tickId != null) {
        //     return;
        // }

        if (this.state !== FireWorkState.Idle) {
            return;
        }
        this.state = FireWorkState.Active;
        // this.render();
        const now = Date.now();
        this.startTime = now;
        this.prevTime = now;
    }

    async restart() {
        // if (this.tickId != null) {
        //     cancelAnimationFrame(this.tickId);
        //     this.tickId = null;
        // }
        if (this.state === FireWorkState.Init) {
            return;
        }
        this.state = FireWorkState.Init;
        const now = Date.now();
        this.startTime = now;
        this.prevTime = now;

        await this.initTransformFeedback();

        this.state = FireWorkState.Active;
        // this.tickId = requestAnimationFrame(this.render);
    }

    async initTransformFeedback(needUpload = true) {
        if (this.initTransfromFeedbackStatus == null) {
            return;
        }
        const { gl } = this;

        const {
            initTransParameters,
            initTransProgram,
            initVa,
            initTf,

            positionBuffers,
            velocityAndSizeBuffers,
            colorBuffers,
        } = this.initTransfromFeedbackStatus;

        if (this.currentStatus.id !== 0) {
            const temp = this.nextStatus;
            this.nextStatus = this.currentStatus;
            this.currentStatus = temp;
        }
        const currentIdx = 1;

        if (needUpload && this.initPositions) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[currentIdx]!);
            gl.bufferData(gl.ARRAY_BUFFER, this.initPositions, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        await this.initTexture(this.picUrl);


        gl.useProgram(initTransProgram);

        gl.bindVertexArray(initVa);

        gl.uniform2f(initTransParameters!.dimensions, this.showWidth, this.showHeight);
        gl.uniform1i(initTransParameters!.colorMap, 0);

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
        gl.bindVertexArray(this.currentStatus.transformVa);
        gl.uniform1f(this.transformParameters!.deltaTime, delta);
        gl.uniform1f(this.transformParameters!.currentTime, currentTime);


        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.currentStatus.tf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.useProgram(this.renderProgram);
        gl.bindVertexArray(this.currentStatus.renderVa);

        // if (!this.matrix) {
        //     const clipMatrix = new Float32Array([
        //         2 / this.showWidth, 0, 0, 0,
        //         0, 2 / this.gl.canvas.height, 0, 0,
        //         0, 0, 1, 0,
        //         -1, -1, 0, 1
        //     ]);
        //     const transformMatrix = composeMatrix(
        //         [0, 0.1, 0],
        //         [0, 0, 0, 1],
        //         [0.5, 0.5, 0.5]
        //     );
            
        //     this.matrix = matrixMultiply(transformMatrix, clipMatrix);
        // }
        // this.transform.sz = -0.2;
        // this.transform.z = -2;


        this.matrix = matrixMultiply(this.viewProjectionMatrix!, this.transform.matrix, this.matrix);
        gl.uniformMatrix4fv(
            this.renderParameters!.matrix,
            false,
            this.matrix!
        );
        
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.bindVertexArray(null);

        this.prevTime = now;
        const temp = this.nextStatus;
        this.nextStatus = this.currentStatus;
        this.currentStatus = temp;

        // this.tickId = requestAnimationFrame(this.render);
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

        this.initPositions = positions;

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

    async initTexture(url: string) {
        const { gl } = this;

        if (!this.texture) {
            const img = await loadImage(url);

            const texture = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            this.texture = texture;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        return this.texture;
    }

    // 临时的, for debug
    createParticleTexture() {
        const { gl } = this;

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d')!;
        const grd = ctx.createRadialGradient(50, 50, 5, 50, 50, 50);
        grd.addColorStop(0, "white");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 100, 100);
        document.body.appendChild(canvas);

        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return texture;
    }

}