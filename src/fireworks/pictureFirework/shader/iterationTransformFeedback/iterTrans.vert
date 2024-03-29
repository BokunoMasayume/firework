#version 300 es
#define WEBGL_2

in vec3 oldPosition;
in vec4 oldColor;
in vec4 oldVelocityAndSize;

uniform float deltaTime;

uniform float currentTime;

// layout(location=0) out vec3 position;
// layout(location=1) out vec4 color;
// layout(location=2) out vec4 velocityAndSize;
out vec3 position;
out vec4 color;
out vec4 velocityAndSize;

#define GRAVITY 25.

#define DAMPEN 2.

void main() {
    vec3 baseVel = oldVelocityAndSize.xyz;
    // vec3 baseVel = vec3(oldVelocityAndSize.x, oldVelocityAndSize.y - deltaTime * GRAVITY, oldVelocityAndSize.z);
    baseVel *= 0.997;
    
    float scaleVel = 0.;
    if (currentTime > 1.2) {
        scaleVel = -1.;
        // baseVel *= 0.5 * deltaTime;
    }


    float vel = length(baseVel);
    vec3 dir = normalize(baseVel);
    if (abs(vel) > 10.) {
        baseVel = baseVel - dir * (vel - 10. * sign(vel)) * DAMPEN * deltaTime;
    }
    baseVel.y = baseVel.y - currentTime * GRAVITY * (oldVelocityAndSize.w / 10. *0.2 + 0.8) ;


    velocityAndSize = vec4(baseVel, oldVelocityAndSize.w + oldVelocityAndSize.w * deltaTime * scaleVel );
    // color = oldColor;
    color = vec4(oldColor.rgb , oldColor.a + oldColor.a * deltaTime * scaleVel);
    position = oldPosition + oldVelocityAndSize.xyz * deltaTime;
}