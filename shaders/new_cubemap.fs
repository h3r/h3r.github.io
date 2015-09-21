precision highp float;

//uniforms
uniform float   u_gamma;
uniform vec4    u_color;
uniform vec3    u_lightvector;
uniform float   u_ref_i;

uniform sampler2D   u_tex;
uniform samplerCube u_ref;

//varyings
varying vec3 v_normal;
varying vec3 v_vertex;
varying vec2 v_coord;

vec4 reflection(){
    return textureCube( u_ref, v_normal );
}

vec4 diffuse(){
    return u_color * texture2D( u_tex, v_coord ) * (1.0 - u_ref_i) ;
}

void main() {
   	vec4 color =  diffuse() + reflection();
    gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);
}