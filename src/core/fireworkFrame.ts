import { BaseFirework } from "../fireworks/base";
import { DemoPostEffect } from "../postEffects/demo";
import { FireWorkState, FireworkConfigParams } from "../types/common";
import { Camera } from "../utils/camera";
import { WebGLContext } from "../utils/webgl";

export class FireworkFrame {
    canvas: HTMLCanvasElement;
    gl: WebGLContext;

    ratio = 2;

    fireworks: BaseFirework[] = [];

    tickId: ReturnType<typeof setTimeout> | null = null;

    postEffects: DemoPostEffect[] = [];

    camera: Camera;

    pictureTexture: WebGLTexture;

    constructor(can: HTMLCanvasElement) {
        this.canvas = can;
        can.width = can.clientWidth * this.ratio;
        can.height = can.clientHeight * this.ratio;

        const width = 1000;
        this.camera = new Camera(width, can.height / can.width * width, 0.1, 400);
        this.camera.z = 200;

        const gl = this.canvas.getContext('webgl2');

        if (!gl) {
            throw new Error('[DemoParticle init] 不支持webgl2');
        }

        this.gl = gl;
        this.pictureTexture = this.createParticleTexture();

        // 设置blend
        gl.enable(gl.BLEND);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        // TODO demo
        this.postEffects.push(
            new DemoPostEffect(this.gl)
        );

    }

    addFirework<T extends BaseFirework, R extends new (gl: WebGLContext, tex: WebGLTexture, ...args: any[]) =>T = new (gl: WebGLContext, ...args: any[]) => T>(
        fireworkClass: R, ...args: FireworkConfigParams<R>
    ): InstanceType<R> {
        const fw = new fireworkClass(this.gl, this.pictureTexture, ...args) as InstanceType<R>;
        fw.viewProjectionMatrix = this.camera.viewProjectionMatrix;
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