#version 300 es
#define WEBGL_2

in vec4 position_seed;
in vec4 velocity_blank;
in vec4 birthTime_lifeTime_size_state;

uniform mat4 matrix;

out vec3 vColor;

void main() {
    gl_PointSize = 20.;
    gl_PointSize = vec4(matrix * vec4(vec3(birthTime_lifeTime_size_state.z * 10.), 0.)).x ;

    // gl_Position = vec4(0., 0., 0., 1.);
    gl_Position = vec4(velocity_blank.xy * 0.4, 0., 1.);

    gl_Position = matrix * vec4(position_seed.xyz, 1.);
    // gl_Position = vec4(0.,1., 0., 1.);
    // gl_Position = vec4(velocity_blank.xy * 0.4, 0., 1.);
    // gl_Position = vec4(birthTime_lifeTime_size_state.xy, 0., 1.);
    // gl_Position = vec4(position_seed.xy, 0., 1.);
    vColor = vec3(position_seed.xy, 0.);
    // vColor = position_seed.xyz * 0.2;
}