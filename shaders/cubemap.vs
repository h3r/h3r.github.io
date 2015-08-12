
precision highp float;

//attributes
attribute vec3 a_vertex;
attribute vec3 a_normal;

//uniforms
uniform mat4 u_mvp;
uniform mat4 u_model;

//varyings
varying vec3 v_normal;
varying vec3 v_pos;

void main() {
    v_pos = a_vertex.xyz;
    v_normal = (u_model * vec4(a_normal,0.0)).xyz;
    gl_Position = u_mvp * vec4(a_vertex,1.0);
}