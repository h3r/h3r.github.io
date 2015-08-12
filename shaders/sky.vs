
precision highp float;
//atributes
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;
//uniforms
uniform mat4 u_mvp;
uniform vec3 u_eye;

//varyings
varying vec3 v_vertex;

void main() {
    v_vertex = a_vertex;
    gl_Position = u_mvp * vec4(vec3(a_vertex.x + u_eye.x,a_vertex.y + u_eye.y,  -(a_vertex.z - u_eye.z)),1.0);
}