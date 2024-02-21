#version 300 es

#define WEBGL_2
#define PI 3.141592653589793
#define RECIPROCAL_PI 0.3183098861837907
#define EPSILON 1e-6

#define STATE_DEFAULT 0.
#define STATE_GROUP_MEMBER 1.
#define STATE_GROUP_DROP 2.

uniform vec3 initPosition;
uniform float currentTime;

out vec4 position_seed;
out vec4 velocity_blank;
out vec4 birthTime_lifeTime_size_state;

float rand( const in vec2 uv ) {
	float a = 12.9898, b = 78.233, c = 43758.5453;
	float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

float hash ( float p ) {
    p = 50.553 * fract(sin(p) * 0.3183099);
    return fract( p );
}

void main() {
    float seedX = hash(float(gl_VertexID) * 0.12);
    // float seedX = hash(float(gl_VertexID) * 0.12 + oldPosition_seed.x);
    float seedY = rand(vec2(seedX, seedX * seedX));
    float seedZ = rand(vec2(seedX, seedY));

    float seed = hash(seedZ);
    position_seed = vec4(
        initPosition,
        seed
    );

    velocity_blank = vec4(
        seedX,
        seedY,
        seedZ,
        0.
    ) * 3.;

    birthTime_lifeTime_size_state = vec4(
        currentTime,
        1.,
        5. + 5. * seed,
        STATE_GROUP_MEMBER
    );
}