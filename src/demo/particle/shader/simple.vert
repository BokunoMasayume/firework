#version 300 es
#define WEBGL_2
#define WEBGL_2
#define attribute in
#define varying out
#define texture2D texture
#define texture3D texture
#define textureCube texture
#define texture2DLodExt textureLod
#define textureCubeLodExt textureLod
precision highp sampler3D;
precision highp float;
precision highp int;


attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0., 1.);
}