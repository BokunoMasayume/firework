#version 300 es
#define WEBGL_2
precision highp sampler3D;
precision highp float;
precision highp int;

#define gl_FragColor pc_fragColor
out highp vec4 pc_fragColor;

in vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.);
    // gl_FragColor = vec4(1., 1., 0., 1.);
}