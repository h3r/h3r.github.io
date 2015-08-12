
precision highp float;
//uniforms
uniform samplerCube u_texture;
uniform vec3 u_eye;

//varyings
varying vec3 v_vertex;

void main() {
    gl_FragColor = textureCube(u_texture, v_vertex);
}