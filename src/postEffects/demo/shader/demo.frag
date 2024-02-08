#version 300 es
#define WEBGL_2
precision highp sampler3D;
precision highp float;
precision highp int;

#define BLOOM_SIZE_HALF 4



in vec2 vUv;

#define gl_FragColor pc_fragColor
out highp vec4 pc_fragColor;

uniform sampler2D map;
uniform vec2 resolutionDivided;

uniform float bloomThread;
uniform float bloomWeight;
uniform vec3 bloomColor;

vec3 grayScaleOperator = vec3(0.3, 0.59, 0.11);

void main() {

    vec4 baseColor = texture(map, vUv);
    vec4 res = vec4(0.);

    vec4 tempColor;
    float tempValue;
    float count = 0.;

    for (int x = -BLOOM_SIZE_HALF; x < BLOOM_SIZE_HALF; x ++) {
        for (int y = -BLOOM_SIZE_HALF; y < BLOOM_SIZE_HALF; y ++) {
            tempColor = texture(map, vUv + resolutionDivided * vec2(float(x), float(y)));
            tempValue = dot(tempColor.rgb, grayScaleOperator);
            if (tempValue < bloomThread) {
                tempColor = vec4(0.);
            }

            count += 1.;
            res += tempColor;
        }
    }

    res /= count;

    baseColor = baseColor + res * vec4(bloomColor, 1.) * bloomWeight;

    baseColor.rgb *= baseColor.a;
    gl_FragColor = baseColor;

    // gl_FragColor = res * vec4(bloomColor, 1.) * bloomWeight;
}