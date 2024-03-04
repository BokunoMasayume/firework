#version 300 es
#define WEBGL_2

#define PI 3.141592653589793
#define RECIPROCAL_PI 0.3183098861837907
#define EPSILON 1e-6
// uniform float deltaTime;

// uniform float currentTime;

in vec4 oldPosition_seed;
in vec4 oldVelocity_blank;
in vec4 oldBirthTime_lifeTime_size_state;

uniform float deltaTime;

uniform float currentTime;

out vec4 position_seed;
out vec4 velocity_blank;
out vec4 birthTime_lifeTime_size_state;

#define STATE_DEFAULT 0.
#define STATE_GROUP_MEMBER 1.
#define STATE_GROUP_DROP 2.

#define GRAVITY 5.

#define DAMPEN 2.

float rand( const in vec2 uv ) {
	float a = 12.9898, b = 78.233, c = 43758.5453;
	float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

float hash ( float p ) {
    p = 50. * fract(p * 0.3183099);
    return fract( p );
}

void main() {
    vec3 baseVel = oldVelocity_blank.xyz;

    baseVel.y = baseVel.y - deltaTime * GRAVITY;

    position_seed = vec4(
        oldPosition_seed.xyz + baseVel * deltaTime,
        oldPosition_seed.w
    );

    velocity_blank = vec4(baseVel, oldVelocity_blank.w);
    birthTime_lifeTime_size_state = oldBirthTime_lifeTime_size_state;
}