#version 300 es
#define WEBGL_2

in vec3 position;
in vec4 color;
in vec4 velocityAndSize;

uniform mat4 matrix;

out vec4 vColor;

void main() {
    gl_PointSize = velocityAndSize.w;
    gl_Position = matrix * vec4(position, 1.);

    vColor = color;
}