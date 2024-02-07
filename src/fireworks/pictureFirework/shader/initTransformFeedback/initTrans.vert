#version 300 es

#define WEBGL_2
#define PI 3.141592653589793
#define RECIPROCAL_PI 0.3183098861837907
#define EPSILON 1e-6

in vec3 initPosition;

uniform sampler2D colorMap;
uniform vec2 dimensions;

// layout(location=0) out vec3 position;
// layout(location=1) out vec4 color;
// layout(location=2) out vec4 velocityAndSize;
out vec3 position;
out vec4 color;
out vec4 velocityAndSize;

float rand( const in vec2 uv ) {
	float a = 12.9898, b = 78.233, c = 43758.5453;
	float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

void main() {
    vec2 uv = initPosition.xy / dimensions;

    color = texture(colorMap, uv);
    // color = vec4(0., 1., 0., color.a);

    vec2 base = dimensions * vec2(0.5, 0.2);
    position = vec3(base, 0.);

    float size = 2. + 3. * rand(uv);

    vec3 velocity = vec3((initPosition.xy - base) * .8, .1);

    velocityAndSize = vec4(velocity, size);
}