#version 300 es
#define WEBGL_2
#define varying in
#define texture3D texture
#define texture2D texture
#define textureCube texture
#define texture2DLodExt textureLod
#define textureCubeLodExt textureLod

#define gl_FragColor pc_fragColor
precision highp float;
precision highp int;
precision highp sampler3D;
precision highp float;
precision highp int;

out highp vec4 pc_fragColor;
// layout(location = ${i}) out vec4 fragData${i};

void main() {
    gl_FragColor = vec4(0., 1., 0., 1.);
}