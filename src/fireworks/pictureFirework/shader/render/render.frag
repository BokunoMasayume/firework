#version 300 es
#define WEBGL_2
precision highp sampler3D;
precision highp float;
precision highp int;
in vec4 vColor;

#define gl_FragColor pc_fragColor
out highp vec4 pc_fragColor;

void main () {
    // gl_FragColor = vec4(0.3647, 0.7294, 0.3725, 1.0);
    
    gl_FragColor = vec4(vColor.rgb * vColor.a, vColor.a);
    // gl_FragColor = vec4(5., 0., 0., 5.);
}