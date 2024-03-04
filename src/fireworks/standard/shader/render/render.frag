#version 300 es
#define WEBGL_2
precision highp sampler3D;
precision highp float;
precision highp int;

#define gl_FragColor pc_fragColor
out highp vec4 pc_fragColor;

in vec3 vColor;
in vec2 vUv;

uniform sampler2D map;

void main() {
    gl_FragColor = texture(map, vUv ) * vec4(1., 1., 0., 1.);
    // gl_FragColor = vec4(vColor, 1.);
    // gl_FragColor = vec4(1., 1., 0., 1.);
}