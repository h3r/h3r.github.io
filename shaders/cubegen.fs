//Fragment Shader
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
    return textureCube( u_ref, vec3(v_normal.x,v_normal.y,-v_normal.z) );
}

vec4 diffuse(){
    return texture2D( u_tex, v_coord ) ;
}

void main() {
    vec4 color = reflection();
   	//vec4 color = ( (diffuse()* (1.0 - u_ref_i))  + reflection());
    gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);
}