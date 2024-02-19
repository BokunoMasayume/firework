#version 300 es
#define WEBGL_2

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main () {
    vUv = uv;

    gl_Position = vec4(position, 1.);
}