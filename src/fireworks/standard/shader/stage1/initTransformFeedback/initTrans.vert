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

in vec4 oldPosition_seed;

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

    float seedX = hash(float(gl_VertexID) * 0.12 + oldPosition_seed.x);
    float seedY = rand(vec2(seedX, seedX * seedX));
    float seedZ = rand(vec2(seedX, seedY));

    // 球面坐标系
    vec3 position = initPosition + vec3(
        seedZ * sin(PI * seedX) * sin(2. * PI * seedY),
        seedZ * sin(PI * seedX) * cos(2. * PI * seedY),
        seedZ * cos(PI * seedX)
    );

    // vec3 position = initPosition;
    // vec3 position = vec3(0., 0., 0.);

    vec3 velocity = vec3(0., 40., 0.);

    float seed = hash(seedZ);
    

    position_seed = vec4(
        position,
        seed
    );
    velocity_blank = vec4(
        velocity,
        0.
    );

    birthTime_lifeTime_size_state = vec4(
        0.3,
        currentTime,
        5. + 5. * seed,
        STATE_GROUP_MEMBER
    );
}