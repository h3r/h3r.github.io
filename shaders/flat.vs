
precision highp float;
//atributes
attribute vec3 a_vertex;

//uniforms
uniform mat4 u_mvp;

void main() {
    gl_Position = u_mvp * vec4(a_vertex,1.0);
    gl_PointSize = 4.0;
}
