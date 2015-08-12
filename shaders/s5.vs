
precision highp float;
//atributes
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;

//uniforms
uniform mat4 u_model;
uniform mat4 u_mvp;

//varyings
varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_coord;

void main() {

    v_vertex = a_vertex.xyz;
    v_normal = (u_model * vec4(a_normal,0.0)).xyz;
    gl_Position = u_mvp * vec4(a_vertex,1.0);

}