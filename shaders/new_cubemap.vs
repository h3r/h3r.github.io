precision highp float;

//attributes
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;

//uniforms
uniform mat4 u_mvp;
uniform mat4 u_model;

//varyings
varying vec3 v_normal;
varying vec3 v_vertex;
varying vec2 v_coord;

void main() {
    v_vertex = a_vertex;
    v_normal = (u_model * vec4(a_normal,0.0)).xyz;
    v_coord  = a_coord;
    gl_Position = u_mvp * vec4(a_vertex,1.0);
}