import { TextureFormat, TextureType } from "../types/common";
import { WebGLContext } from "../utils/webgl";

export type TextureConfig = {
    width?: number;
    height?: number;
    format?: TextureFormat;
    type?: TextureType;
};

const DefaultTextureConfig: TextureConfig = {
    width: 512,
    height: 512,
    format: TextureFormat.RGBA,
    type: TextureType.UNSIGNED_BYTE,
};

export class Texture {

    gl: WebGLContext;

    texture: WebGLTexture;
    

    format: TextureFormat = TextureFormat.RGBA;
    type: TextureType = TextureType.FLOAT;

    width = 512;
    height = 512;

    constructor(gl: WebGLContext, config: TextureConfig = {}) {
        this.gl = gl;

        Object.assign(this, DefaultTextureConfig, config) as Required<TextureConfig>;

        this.texture = this.createTexture();
        
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