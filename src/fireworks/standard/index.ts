import { FireWorkState } from "../../types/common";
import { TransformFeedbackStatus } from "../../types/transformFeedback";
import { WebGLContext, createProgram, createShader, getParameters } from "../../utils/webgl";
import { BaseFirework } from "../base";

import stage1InitTransVert from './shader/stage1/initTransformFeedback/initTrans.vert';
import stage1InitTransFrag from './shader/stage1/initTransformFeedback/initTrans.frag';
import stage1IterTransVert from './shader/stage1/iterationTransformFeedback/iterTrans.vert';
import stage1IterTransFrag from './shader/stage1/iterationTransformFeedback/iterTrans.frag';
import renderVert from './shader/render/render.vert';
import renderFrag from './shader/render/render.frag';
import stage2InitTransVert from './shader/stage2/initTransformFeedback/initTrans.vert';
import stage2InitTransFrag from './shader/stage2/initTransformFeedback/initTrans.frag';
import stage2IterTransVert from './shader/stage2/iterationTransformFeedback/iterTrans.vert';
import stage2IterTransFrag from './shader/stage2/iterationTransformFeedback/iterTrans.frag';
import { composeMatrix, matrixMultiply } from "../../utils/math";
import { sleep } from "../../utils/common";

/**
 * stage 1: 
 * 大家有公共的起点， 随机有一些会掉队
 * 所以分为两个状态
 * 掉队和没掉队
 * 
 * stage 2:
 * 起始时分成两种： 聚合成员 和 独走
 * 聚合成员分为掉队的和没掉队的
 * 
 * 因此要存的东西有： 
 * 发射过程的状态 / 爆炸过程的状态 
 * 位置
 * 速度
 * 
 * 在第一阶段前需要有个初始化过程
 * 在第二阶段前需要有个初始化过程
 * 
 * 粒子的状态：
 * 1. 聚合 - 未掉队
 * 拥有一个初始的位置和速度
 * 每一个tick， 按照速度更新位置， 且可能变为聚合 - 掉队状态
 * 2. 聚合 - 掉队
 * 在切换为该状态时，可更新速度， 相比于原来的速度加个垂直的分量， 凋亡速度可以比较快
 * 3. 默认
 * 普通的
 * 
 * 单个粒子的状态集合：
 * 1. 位置 vec3
 * 2. 速度 vec3
 * 3. 生命时长 float
 * 4. 大小 float
 * 5. 状态 int（聚合-未掉队， 聚合-掉队， 默认）
 * 
 * 
 * 
 */
export class StandardFirework extends BaseFirework {
    numParticle = 3000;

    private stage = 0;

    // stage1 iter transform feedback
    transformProgram: WebGLProgram | null = null;
    transformParameters?: ReturnType<typeof getParameters>;

    // stage2 iter transform feedback
    stage2TransformProgram: WebGLProgram | null = null;
    stage2TransformParameters?: ReturnType<typeof getParameters>;

    // status
    currentStatus!: TransformFeedbackStatus;
    nextStatus!: TransformFeedbackStatus;

    // stage1 & 2 init transform feedback status
    initTransformFeedbackStatus?: {
        initTransParameters: any;
        initTransProgram: WebGLProgram;

        // stage 2 init transform feedback 
        stage2InitTransParameters: any;
        stage2InitTransProgram: WebGLProgram;

        initVa: WebGLVertexArrayObject;
        initTf: WebGLTransformFeedback;
    }

    // render
    renderProgram: WebGLProgram | null = null;
    renderParameters?: ReturnType<typeof getParameters>;

    matrix?: Float32Array;


    // debug 用
    positionBuffers!: [WebGLBuffer, WebGLBuffer];
    velocityBuffers!: [WebGLBuffer, WebGLBuffer];
    stateBuffers!: [WebGLBuffer, WebGLBuffer];
    
    // particleTexture: WebGLTexture;
    readBuffers() {
        console.log('position[0]', this.readBuffer(this.positionBuffers[0], this.numParticle * 4));
        console.log('velocity[0]', this.readBuffer(this.velocityBuffers[0], this.numParticle * 4));
        console.log('state[0]', this.readBuffer(this.stateBuffers[0], this.numParticle * 4));

        console.log('position[1]', this.readBuffer(this.positionBuffers[1], this.numParticle * 4));
        console.log('velocity[1]', this.readBuffer(this.velocityBuffers[1], this.numParticle * 4));
        console.log('state[1]', this.readBuffer(this.stateBuffers[1], this.numParticle * 4));
    }

    constructor(gl: WebGLContext, tex: WebGLTexture) {
        super(gl, tex);

        this.transform.s3 = 10;
        this.transform.y = -500;

        // this.particleTexture = this.createParticleTexture();
    }

    init() {
        this.state = FireWorkState.Init;

        const { gl } = this;

        // init programs
        const { initTransParameters, initTransProgram, stage2InitTransParameters, stage2InitTransProgram } = this.initProgram();
        // init buffers
        const { positionBuffers, velocityBuffers, stateBuffers } = this.initBuffers();

        this.positionBuffers = positionBuffers as any;
        this.velocityBuffers = velocityBuffers as any;
        this.stateBuffers = stateBuffers as any;
        /**
         * 
         * @param idx 输入buffer的idx, 绘制使用的是输出的另一个
         * @returns 
         */
        const createStatus = (idx = 0) => {
            const current = idx;
            const next = (current + 1) % 2;

            return {
                id: current,

                // transform feedback 输入
                transformVa: this.createVaStatus([
                    {
                        buffer: positionBuffers[current]!,
                        location: this.transformParameters!.oldPosition_seed as number,
                        numComponent: 4

                    }, {
                        buffer: velocityBuffers[current]!,
                        location: this.transformParameters!.oldVelocity_blank as number,
                        numComponent: 4
                    }, {
                        buffer: stateBuffers[current]!,
                        location: this.transformParameters!.oldBirthTime_lifeTime_size_state as number,
                        numComponent: 4,
                    }
                ])!,

                // transform feedback 输出
                tf: this.createTfStatus([
                    positionBuffers[next]!,
                    velocityBuffers[next]!,
                    stateBuffers[next]!
                ]),

                // render 输入
                renderVa: this.createVaStatus([
                    {
                        buffer: positionBuffers[next]!,
                        location: this.renderParameters!.position_seed as number,
                        numComponent: 4,
                    }, {
                        buffer: velocityBuffers[next]!,
                        location: this.renderParameters!.velocity_blank as number,
                        numComponent: 4,
                    }, {
                        buffer: stateBuffers[next]!,
                        location: this.renderParameters!.birthTime_lifeTime_size_state as number,
                        numComponent: 4,
                    }
                ], true, this.renderParameters!.instancePosition as number, this.renderParameters!.instanceUv as number)!
            };
        }; // end createStatus

        this.currentStatus = createStatus(0);
        this.nextStatus = createStatus(1);


        // create initial transform feedback needed status
        const initVa = this.createVaStatus([
            // {
            //     buffer: positionBuffers[1]!,
            //     location: initTransParameters!.oldPosition_seed as number,
            //     numComponent: 4
            // }
        ])!;

        const initTf = this.createTfStatus([
            positionBuffers[0]!,
            velocityBuffers[0]!,
            stateBuffers[0]!
        ]);

        this.initTransformFeedbackStatus = {
            initTransProgram,
            initTransParameters,
            initVa,
            initTf,

            stage2InitTransParameters,
            stage2InitTransProgram,
        };

        this.state = FireWorkState.Idle;
    }

    render() {
        const { gl } = this;
        const now = Date.now();

        // TODO debug
        // gl.clearColor(0, 0, 0, 0);
        // gl.clearDepth(1);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!this.startTime || !this.prevTime) {
            this.startTime = now;
            this.prevTime = now;
        }

        const delta = (now - this.prevTime) / 1000;
        const currentTime = (now - this.startTime) / 1000;
        // console.log(delta, currentTime)

        if (this.stage === 1 && currentTime > 1) {
            this.stage2InitTransformFeedback();
        }
        // transform 

        if ( this.stage === 1) {
            gl.useProgram(this.transformProgram);
            gl.bindVertexArray(this.currentStatus.transformVa);
            gl.uniform1f(this.transformParameters!.deltaTime, delta);
            gl.uniform1f(this.transformParameters!.currentTime, currentTime);
        } else {
            // stage == 2
            gl.useProgram(this.stage2TransformProgram);
            gl.bindVertexArray(this.currentStatus.transformVa);
            gl.uniform1f(this.stage2TransformParameters!.deltaTime, delta);
            gl.uniform1f(this.stage2TransformParameters!.currentTime, currentTime);
        }
        

        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.currentStatus.tf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);

        // render
        gl.useProgram(this.renderProgram);
        gl.bindVertexArray(this.currentStatus.renderVa);

        this.matrix = matrixMultiply(this.viewProjectionMatrix!, this.transform.matrix, this.matrix);
        

        gl.uniformMatrix4fv(this.renderParameters!.matrix, false, this.matrix);

        // gl.drawArrays(gl.POINTS, 0, this.numParticle);
        // gl.drawArraysInstanced(gl.POINTS, 0, 6, this.numParticle);

        gl.uniform1i(this.renderParameters!.map, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.numParticle);
        gl.bindVertexArray(null);

        this.prevTime = now;
        const temp = this.nextStatus;
        this.nextStatus = this.currentStatus;
        this.currentStatus = temp;
    }

    start() {

        if (this.state !== FireWorkState.Blank && this.state !== FireWorkState.Idle) {
            return;
        }

        const now = Date.now();
        this.startTime = now;
        this.prevTime = now;

        switch (this.state) {
            case FireWorkState.Blank:
                this.init();
                this.initTransformFeedback();
                break;
            case FireWorkState.Idle:
                this.initTransformFeedback();
                break;
            default: 
                return;
        }

        this.state = FireWorkState.Active;
    }

    restart() {
        if (this.state === FireWorkState.Active) {
            this.state = FireWorkState.Idle;
        } 

        this.start();
    }

    private initTransformFeedback() {
        if (this.initTransformFeedbackStatus == null) {
            return;
        }

        this.stage = 1;

        const { gl } = this;

        const {
            initTransParameters,
            initTransProgram,
            initTf,
            initVa,
        } = this.initTransformFeedbackStatus;

        if (this.currentStatus.id !== 0) {
            const temp = this.nextStatus;
            this.nextStatus = this.currentStatus;
            this.currentStatus = temp;
        }


        // 开init
        gl.useProgram(initTransProgram);

        gl.bindVertexArray(initVa);

        gl.uniform1f(initTransParameters!.currentTime, (this.prevTime - this.startTime) / 1000);
        gl.uniform3f(initTransParameters!.initPosition, 0, 0, 0);

        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, initTf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindVertexArray(null);
    }

    private stage2InitTransformFeedback() {
        if (this.initTransformFeedbackStatus == null) {
            return;
        }

        this.stage = 2;

        const { gl } = this;

        const {
            stage2InitTransParameters,
            stage2InitTransProgram,
            initTf,
            initVa,
        } = this.initTransformFeedbackStatus;

        if (this.currentStatus.id !== 0) {
            const temp = this.nextStatus;
            this.nextStatus = this.currentStatus;
            this.currentStatus = temp;
        }

        gl.useProgram(stage2InitTransProgram);
        gl.bindVertexArray(initVa);

        gl.uniform1f(stage2InitTransParameters!.currentTime, (this.prevTime - this.startTime) / 1000);
        gl.uniform3f(stage2InitTransParameters!.initPosition, 0, 100, 0);

        gl.enable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, initTf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.numParticle);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindVertexArray(null);

    }

    private initProgram() {
        const { gl } = this;


        // stage 1 init transform feedback
        const initTransProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, stage1InitTransVert),
            createShader(gl, gl.FRAGMENT_SHADER, stage1InitTransFrag),
            ['position_seed', 'velocity_blank', 'birthTime_lifeTime_size_state']
        );

        if (!initTransProgram) {
            throw new Error('[Firework] failed to create program (standardFirework)');
        }
        const initTransParameters = getParameters(gl, initTransProgram);

        // stage 1 iter transform feedback
        this.transformProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, stage1IterTransVert),
            createShader(gl, gl.FRAGMENT_SHADER, stage1IterTransFrag),
            ['position_seed', 'velocity_blank', 'birthTime_lifeTime_size_state']
        );
        if (!this.transformProgram) {
            throw new Error('[Firework] failed to create program (standardFirework)');
        }
        this.transformParameters = getParameters(gl, this.transformProgram);

        // stage 2 init transform feedback
        const stage2InitTransProgram = createProgram(
            gl, 
            createShader(gl, gl.VERTEX_SHADER, stage2InitTransVert),
            createShader(gl, gl.FRAGMENT_SHADER, stage2InitTransFrag),
            ['position_seed', 'velocity_blank', 'birthTime_lifeTime_size_state']
        );

        if (!stage2InitTransProgram) {
            throw new Error('[Firework] failed to create program (standardFirework)');
        }

        const stage2InitTransParameters = getParameters(gl, stage2InitTransProgram);


        // stage 2 iter transform feedback
        this.stage2TransformProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, stage2IterTransVert),
            createShader(gl, gl.FRAGMENT_SHADER, stage2IterTransFrag),
            ['position_seed', 'velocity_blank', 'birthTime_lifeTime_size_state']
        );

        if (!this.stage2TransformProgram) {
            throw new Error('[Firework] failed to create program (standardFirework)');
        }

        this.stage2TransformParameters = getParameters(gl, this.stage2TransformProgram);

        // render
        this.renderProgram = createProgram(
            gl,
            createShader(gl, gl.VERTEX_SHADER, renderVert),
            createShader(gl, gl.FRAGMENT_SHADER, renderFrag)
        );

        if (!this.renderProgram) {
            throw new Error('[Firework] failed to create program (standardFirework)');
        }

        this.renderParameters = getParameters(gl, this.renderProgram);

        return {
            initTransProgram,
            initTransParameters,

            stage2InitTransProgram,
            stage2InitTransParameters,
        }

    }

    private initBuffers() {
        const { gl } = this;

        const positions = new Float32Array(this.numParticle * 4);
        const velocity = new Float32Array(this.numParticle * 4);
        const states = new Float32Array(this.numParticle * 4);

        const positionBuffers = [
            this.initBuffer(positions),
            this.initBuffer(positions)
        ];
        const velocityBuffers = [
            this.initBuffer(velocity),
            this.initBuffer(velocity)
        ];
        const stateBuffers = [
            this.initBuffer(states),
            this.initBuffer(states)
        ];

        return {
            positionBuffers,
            velocityBuffers,
            stateBuffers,
        }

    }

}