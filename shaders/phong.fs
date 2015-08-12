
precision highp float;
//uniforms
uniform vec3 u_lightvector;
uniform vec4 u_color;
uniform float u_gamma;

//varyings
varying vec3 v_normal;
varying vec2 v_coord;

void main() {
    vec3 N = normalize(v_normal);
    vec4 color = u_color * max(0.0, dot(u_lightvector,N));
    gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);
}