
precision highp float;

//uniforms
uniform vec3 u_lightvector;
uniform vec4 u_color;
uniform samplerCube u_texture;
uniform samplerCube u_refl_map;
uniform bool u_has_tex;
uniform bool u_has_ref;
uniform float u_refl;
uniform float u_gamma;

//varyings
varying vec3 v_normal;
varying vec3 v_pos;

vec4 reflection(){

    vec4 ref_color = vec4(1.0,1.0,1.0,1.0);

    if(u_has_ref){
        ref_color = textureCube( u_refl_map, vec3(v_normal.x,v_normal.y,-v_normal.z) );
    }

    return ref_color * u_refl;
}

vec4 diffuse(){

    vec4  diff_color = u_color;

    if(u_has_tex){
        diff_color = textureCube( u_texture, v_pos );
    }

    return diff_color * (1.0 - u_refl);
}

void main() {
    vec3 N = normalize(v_normal);
   	vec4 color = (diffuse()  + reflection());
    gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);
}