import { FireWorkState } from "../../types/common";
import type { BufferStatus } from "../../types/transformFeedback";
import { type WebGLContext } from "../../utils/webgl";

let idIncreasing = 0;
export abstract class BaseFirework {
    readonly id: number;
    protected iState: FireWorkState = FireWorkState.Blank;
    get state() {
        return this.iState;
    }
    set state(s: FireWorkState) {
        this.iState = s;
    }

    gl: WebGLContext;

    startTime!: number;
    prevTime!: number;

    constructor(gl: WebGLContext) {
        this.id = idIncreasing ++;
        this.gl = gl;
    }

    abstract render(): void;

    abstract start(): any;

    abstract restart(): any;

    protected createVaStatus(statuses: BufferStatus[], forInstanced = false) {
        const { gl } = this;
        const va = gl.createVertexArray();
        gl.bindVertexArray(va);

        statuses.forEach(status => {
            gl.bindBuffer(gl.ARRAY_BUFFER, status.buffer);
            gl.enableVertexAttribArray(status.location);
            gl.vertexAttribPointer(
                status.location,
                status.numComponent,
                gl.FLOAT,
                false,
                0,
                0,
            );
            forInstanced && gl.vertexAttribDivisor(status.location, 1);
        });

        // if (forInstanced) {
        //     const uv = new Float32Array([

        //     ])
        // }

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return va;
    }

    protected createTfStatus(buffers: WebGLBuffer[]) {
        const { gl } = this;

        const tf = gl.createTransformFeedback();

        if (!tf) {
            throw new Error(`[Firework] Failed to create TransformFeedback`);
        }

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

        buffers.forEach((buffer, idx) => {
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, idx, buffer);
        });

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return tf;
    }

    protected initBuffer(data: Float32Array) {
        const { gl } = this;
        const buffer = gl.createBuffer();
        this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        if (buffer == null) {
            throw new Error(`[Firework] Failed to create buffer`);
        }
        return buffer;
    }

    // 慎用, 似乎会和transform feedback冲突, 导致无法写入
    protected readBuffer(buffer: WebGLBuffer, size: number) {
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