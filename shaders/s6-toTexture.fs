
precision highp float;
//uniforms
uniform sampler2D u_texture;
uniform vec4 u_color;
uniform vec3 u_lightvector;
uniform float u_gamma;

//varyings
varying vec3 v_normal;
varying vec2 v_coord;

void main() {
    vec3 N = normalize(v_normal);
    vec4 color = u_color * texture2D( u_texture, v_coord);
    gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);
}