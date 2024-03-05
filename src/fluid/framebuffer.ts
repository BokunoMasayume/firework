import { TextureFormat, TextureType } from "../types/common";
import { WebGLContext } from "../utils/webgl";
import { Texture, TextureConfig } from "./texture";

export type FrameBufferConfig = {
    width?: number;
    height?: number;
    textures: TextureConfig[];
};

const DefaultFrameBufferConfig: FrameBufferConfig = {
    width: 512,
    height: 512,
    textures: [{}]
};

export class FrameBuffer {
    gl: WebGLContext;

    framebuffer: WebGLFramebuffer;
    textures: Texture[] = [];

    width = 512;
    height = 512;

    constructor(gl: WebGLContext, config: FrameBufferConfig) {
        this.gl = gl;

        const con = Object.assign({}, DefaultFrameBufferConfig, config) as Required<FrameBufferConfig>;
        this.width = con.width;
        this.height = con.height;
        

        const fb = this.framebuffer = this.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        con.textures.forEach((tex, idx) => {
            const texture = new Texture(gl, tex);
            this.textures.push(texture);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + idx, gl.TEXTURE_2D, texture, 0);
        });
        this.setDrawBuffers();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }

    setDrawBuffers() {
        const { gl } = this;
        gl.drawBuffers(this.textures.map((_, idx) => {
            return gl.COLOR_ATTACHMENT0 + idx;
        }));
    }

    setViewport() {
        this.gl.viewport(0, 0, this.width, this.height);
    }

    createFramebuffer() {
        const fb = this.gl.createFramebuffer()!;
        return fb;
    }

    createTexture() {
        const { gl, width, height } = this;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        const { internalFormat, format, type } = this.getTextureFormatAndType();
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null );

        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    setTarget() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.setViewport();
    }

    unsetTarget() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    getTextureFormatAndType() {
        const { gl } = this;
        let type: number = gl.BYTE;

        let internalString: string = 'RGBA';
        switch(this.type) {
            case TextureType.UNSIGNED_BYTE:
                type = gl.UNSIGNED_BYTE;
                internalString = '8';

                if (this.format === TextureFormat.RGB || this.format === TextureFormat.RGBA) {
                    internalString = '';
                }
                break;
            case TextureType.FLOAT:
                type = gl.FLOAT;
                internalString = '32F';

                break;
            case TextureType.HALF_FLOAT:
                type = gl.HALF_FLOAT;
                internalString = '16F';

                break;
            default:
                type = gl.BYTE;
        }

        let format: number = gl.RGBA;
        switch (this.format) {
            case TextureFormat.R:
                format = gl.RED;
                internalString = 'R' + internalString;
                break;
            case TextureFormat.RG:
                format = gl.RG;
                internalString = 'RG' + internalString;
                break;
            case TextureFormat.RGB:
                format = gl.RGB;
                internalString = 'RGB' + internalString;
                break;
            default:
                format = gl.RGBA;
                internalString = 'RGBA' + internalString;

        }

        const internalFormat = gl[internalString as 'RGBA'] as number;

        return {
            internalFormat,
            format,
            type,
        }

    }
}