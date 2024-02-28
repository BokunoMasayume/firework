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
    float seedX = hash(oldPosition_seed.w);
    if (abs(oldBirthTime_lifeTime_size_state.w - STATE_GROUP_MEMBER) < EPSILON) {
        // 集群 - 未掉队        
        float seedY = hash(seedX);
        float seedZ = hash(seedY);
        float state = STATE_GROUP_MEMBER;

        // vec3 position = oldPosition_seed.xyz + vec3(0., 0.1, 0.);
        // vec3 position = vec3(1., 3., 0.) * currentTime;
        vec3 position = oldPosition_seed.xyz + oldVelocity_blank.xyz * deltaTime;
        if (abs(seedZ) < 0.002) {
        // if (abs(seedZ) < 1. * deltaTime) {
            // 掉队
            state = STATE_GROUP_DROP;
            // 更新速度和birthtime lifetime
            vec3 velocity = normalize(cross(oldVelocity_blank.xyz, vec3(seedX, seedY, seedZ) ));
            // velocity_blank = vec4(0., 0., 0., 0.);
            velocity_blank = vec4(velocity * 3., 0.);
            birthTime_lifeTime_size_state = vec4(
                currentTime,
                2. * seedZ,
                oldBirthTime_lifeTime_size_state.z,
                state
            );
        } else {
            state = STATE_GROUP_MEMBER;
            velocity_blank = oldVelocity_blank;
            birthTime_lifeTime_size_state = oldBirthTime_lifeTime_size_state;
        }
        

        position_seed = vec4(position, seedZ);
    } else {
        // 集群 - 掉队

        vec3 position = oldPosition_seed.xyz + oldVelocity_blank.xyz * deltaTime;
        position_seed = vec4(position, seedX);
        birthTime_lifeTime_size_state = oldBirthTime_lifeTime_size_state;
        velocity_blank = oldVelocity_blank;

    }
}