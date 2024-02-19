import { BaseFirework } from "../fireworks/base";
import { DemoPostEffect } from "../postEffects/demo";
import { FireWorkState, FireworkConfigParams } from "../types/common";
import { WebGLContext } from "../utils/webgl";

export class FireworkFrame {
    canvas: HTMLCanvasElement;
    gl: WebGLContext;

    ratio = 2;

    fireworks: BaseFirework[] = [];

    tickId: ReturnType<typeof setTimeout> | null = null;

    postEffects: DemoPostEffect[] = [];

    constructor(can: HTMLCanvasElement) {
        this.canvas = can;
        can.width = can.clientWidth * this.ratio;
        can.height = can.clientHeight * this.ratio;

        const gl = this.canvas.getContext('webgl2');

        if (!gl) {
            throw new Error('[DemoParticle init] 不支持webgl2');
        }

        this.gl = gl;


        // TODO demo
        // this.postEffects.push(
        //     new DemoPostEffect(this.gl)
        // );

    }

    addFirework<T extends BaseFirework, R extends new (gl: WebGLContext, ...args: any[]) =>T = new (gl: WebGLContext, ...args: any[]) => T>(
        fireworkClass: R, ...args: FireworkConfigParams<R>
    ): InstanceType<R> {
        const fw = new fireworkClass(this.gl, ...args) as InstanceType<R>;
        this.fireworks.push(fw);
        return fw;
    }

    start() {
        if (this.tickId != null) {
            return;
        }

        this.tickId = requestAnimationFrame(this.render);
    }

    render = () => {

        const { gl } = this;

        if (this.postEffects.length > 0) {
            this.setRenderTarget(this.postEffects[0]!.framebuffer);
            this.gl.viewport(0, 0, this.postEffects[0]!.width, this.postEffects[0]!.height );
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        this.fireworks.forEach(fw => {
            if (fw.state === FireWorkState.Active) {
                fw.render()
            }
        });

        for (let i = 0; i < this.postEffects.length; i ++) {
            const nextFb = i === (this.postEffects.length - 1) ? null: this.postEffects[i + 1]!.framebuffer;
            const postEffect = this.postEffects[i]!;
            postEffect.render(nextFb);
        }

        this.tickId = requestAnimationFrame(this.render);
    }

    // 渲染用
    private currentTarget: WebGLFramebuffer | null = null;
    setRenderTarget(target: WebGLFramebuffer | null = null) {
        // if (target === this.currentTarget) {
        //     return;
        // }

        const { gl } = this;
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        this.currentTarget = target;
    }
}