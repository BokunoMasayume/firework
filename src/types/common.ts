import { BaseFirework } from "../fireworks/base";
import { WebGLContext } from "../utils/webgl";

export enum FireWorkState {
    Blank,
    Init,
    Idle,
    Active,
    Destroyed,
};

export type FireworkConfigParams<T extends typeof BaseFirework> = T extends new (gl: WebGLContext, ...args: infer R) => BaseFirework ? R: never;

export enum TextureFormat {
    R,
    RG,
    RGB,
    RGBA
};

export enum TextureType {
    BYTE,
    UNSIGNED_BYTE,
    FLOAT,
    HALF_FLOAT,
};