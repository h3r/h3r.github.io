
precision highp float;
//atributes
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;

//uniforms
uniform mat4 u_mvp;
uniform mat4 u_model;

//varyings
varying vec2 v_coord;
varying vec3 v_normal;

void main() {
    v_coord = a_coord;
    v_normal = (u_model * vec4(a_normal,0.0)).xyz;
    gl_Position = u_mvp * vec4(a_vertex,1.0);
}
