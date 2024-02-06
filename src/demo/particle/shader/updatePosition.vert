#version 300 es
#define WEBGL_2
#define attribute in
#define varying out

in vec2 oldPosition;
in vec2 velocity;

uniform float deltaTime;
uniform vec2 canvasDimensions;

out vec2 newPosition;

vec2 euclideanModulo(vec2 n, vec2 m) {
    return mod(mod(n,m) + m, m);
}

void main() {
    newPosition = euclideanModulo(
        oldPosition + velocity * deltaTime,
        canvasDimensions
    );
}