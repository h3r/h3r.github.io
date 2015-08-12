#define n_vacio     1.0
#define n_aire      1.00029
#define n_hielo     1.31
#define n_agua      1.333
#define n_quarzo    1.46
#define n_cristal   1.55 // 1.5-1.6
#define n_zafiro    1.77
#define n_diamante  2.42

precision highp float;
//uniforms
uniform float u_gamma;
uniform vec4  u_D;
uniform float u_G;
uniform float u_F0;


uniform vec4 u_Diffusec;
uniform vec4 u_Lightc;


//varyings
varying vec3 v_vertex;
varying vec3 v_normal;
varying vec3 v_coord;

vec3 reflection(){
    return vec3(0);
}

vec3 transmission(){
    /*
    Snell's Law

        n1 * sin theta1 = n2 sin theta2;

        Where:
            n1,n2 : índice de refracción de la superficie
            theta1: angulo de incidencia respecto a la normal
            theta2: angulo de refracción respecto a la normal inversa
            thetaC: angulo límite cuando theta1 es mayor a arcsin(n2/n1)
    */
    return vec3(0);
}

float fresnel_term(float F0, float LdotH, float fresnelPow){
    //http://www.gamedev.net/topic/625142-blinn-phong-with-fresnel-effect/
    //http://alunevans.info/apps/webgl/pbr/
    //float F0 = pow((1.0f-(1.0f/1.31f)), 2)/pow((1.0f+(1.0f/1.31f)), 2);
    return F0 + pow(1.0 - LdotH, fresnelPow) * (1.0 - F0);
}


vec4 diffColor(){
    return u_Diffusec;
}

vec4 diffuse_component(float NdotL){
    return diffColor() * ( 1.0 -  fresnel_term(u_F0,NdotL, 1.0) );
}
vec4 specular_component(float LdotH){
    //http://jcgt.org/published/0003/02/03/paper.pdf
    //PBR (DGF)/(NdotV) D = Micro Gometry Term; G = Shadowing/Masking Term; F = Fresnel Term; NdotV is the glare effect term
    return u_D * u_G * fresnel_term(u_F0,LdotH, 5.0);
}
vec4 gamma_correct(vec4 color, float gamma){
    return vec4(0);// pow(color.xyz, gamma) ,color.w);
}
void main() {
    float NdotL = 1.0;
    float LdotH = 1.0;
     gl_FragColor = gamma_correct( (diffuse_component(NdotL) + specular_component(LdotH)) * u_Lightc , u_gamma);
}