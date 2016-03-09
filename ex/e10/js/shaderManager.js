
var shaderManager = {
    setUniforms : function(node){
        if(node.ambient)        node._uniforms.u_ka = node.ambient;
        if(node.specularity)    node._uniforms.u_ks = node.specularity;
        if(node.emisive)        node._uniforms.u_ke = node.emisive;

        if(node.glossiness)     node._uniforms.u_glossiness = $custom.gloss;// node.glossiness;
        if(node.alpha)          node._uniforms.u_opacity = node.alpha;
        if(node.color_filter)   node._uniforms.u_filter = node.color_filter;
    },

    getShader:function(node,callback){

        if(node.updated && gl.shaders[node.shader])
            return;

        node.updated = true;

            var material = gl.materials[node.material];
            if(material){
                if(material.ka) node.ambient     = material.ka;
                if(material.kd) node.color       = material.kd;
                if(material.ks) node.specularity = material.ks;
                if(material.ke) node.emisive     = material.ke;
                if(material.ns){
                    node.glossiness  = material.ns;
                    node.flags.value = flagOn(node.flags.value,_f.NS);
                }
                if(material.d ){
                    node.opacity     = material.d;
                    node.flags.value = flagOn(node.flags.value,_f.D);
                }

                if(material.tr){
                    ode.filter      = material.tr;
                    node.flags.value = flagOn(node.flags.value,_f.TR);
                }

                if(material.map_ka) node.textures.map_ka = material.map_ka;
                if(material.map_kd) node.textures.color  = material.map_kd;
                if(material.map_ks) node.textures.map_ks = material.map_ks;
                if(material.map_ke) node.textures.map_ke = material.map_ke;

            }


            if(node.flags.value == undefined) node.flags.value = 0;
            if(node.textures.map_ka) node.flags.value = flagOn(node.flags.value,_f.MAP_KA);
            if(node.textures.color)  node.flags.value = flagOn(node.flags.value,_f.MAP_KD);
            if(node.textures.map_ks) node.flags.value = flagOn(node.flags.value,_f.MAP_KS);
            if(node.textures.map_ke) node.flags.value = flagOn(node.flags.value,_f.MAP_KE);



            node.shader = createShaderWith(node.flags.value);

        if(!node.shader)
            node.shader = 'phong';

    }

};

/*------------------------------------------------------------------------------------------*/
//Flags
var _f = {
    //Configuration Flags
    MAP_KA  :  1, // 0000 0001  //
    MAP_KD  :  2, // 0000 0010  //
    MAP_KS  :  4, // 0000 0100  //
    MAP_KE  :  8, // 0000 0100  //
    MAP_R   : 16, // 0000 1000  //
    NS      : 32, // 0001 0000  //
    IOR     : 64, // 0010 0000  //
    D       :128, // 0100 0000  //
    TR      :256, // 1000 0000  //

}
/*------------------------------------------------------------------------------------------*/


createShaderWith = function(flags) {
    var shaderID = flags;
    if(gl.shaders[shaderID])
        return shaderID;

    /**
     * Illum
     0. Color on and Ambient off
     1. Color on and Ambient on
     2. Highlight on
     3. Reflection on and Ray trace on
     4. Transparency: Glass on, Reflection: Ray trace on
     5. Reflection: Fresnel on and Ray trace on
     6. Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
     7. Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
     8. Reflection on and Ray trace off
     9. Transparency: Glass on, Reflection: Ray trace off
     10. Casts shadows onto invisible surfaces
     */


    var uniforms = [['mat4 u_mvp','mat4 u_model'],
                    ['vec3 u_eye','vec3 u_light_pos', 'vec3 u_light_color','float u_glossiness', 'vec3 u_ka', 'vec4 u_color', 'vec3 u_ks', 'vec3 u_ke']];
    var varyings = ['vec3 v_vertex','vec3 v_normal','vec2 v_coord'];
    var functions = {};

    if(getFlag(flags,_f.IOR) || true){
        var f = 'float fresnel(float cosTheta, float R0, float fresnelPow){';
        f+= 'float facing = (1.0 - cosTheta); ';
        f+= 'return max(0.0, R0 + (1.0 - R0) * pow(facing, fresnelPow));}';

        f+= "float fresnel_dielectrics(float cos_i, float cos_t, float n_i, float n_t){";
        f+= "float r_parl =  ((n_t * cos_i) - (n_i * cos_t)) / ((n_t * cos_i) + (n_i * cos_t));";
        f+= "float r_perp =  ((n_i * cos_i) - (n_t * cos_t)) / ((n_i * cos_i) + (n_t * cos_t));";

        f+="    return ((r_parl * r_parl) + (r_perp * r_perp)) * 0.5;}";

        functions['fresnel'] = f;
    }
    /**
     * Refraction indices for the medium (PBR P.H p.434)
     * Vacuum               -   1.0
     * Air at sea level     -   1.00029
     * Ice                  -   1.31
     * Water (20ºC)         -   1.333
     * Fused quartz         -   1.46
     * Glass                -   1.5 to 1.6
     * Sapphire             -   1.77
     * Diamond              -   2.42
     * */
    /*


    //cos_i : NdotE
    //cos_t : NdotR (R should be computed using snells law)
    //k : absortion coeficient
    //n_i : index of refraction for the incident media
    //n_t : index of refraction for de transmited media

    float fresnel_dielectrics(float cos_i, float cos_t, float n_i, float n_t){
        float r_parl =  ((n_t * cos_i) - (n_i * cos_t)) /
                        ((n_t * cos_i) + (n_i * cos_t));
        float r_perp =  ((n_i * cos_i) - (n_t * cos_t)) /
                        ((n_i * cos_i) + (n_t * cos_t));

        return ((r_parl * r_parl) + (r_perp * r_perp)) * 0.5;
    }//"Due to conservation of energy, energy transmitted by a dielectric is 1 - Fr." (PBR P.H. p.435)

    float fresnel_conductors(|float cos_i|, float n_i, float k){
        float tmp_f     = ((n_i*n_i) + (k*k));
        float cos_i2    = cos_i * cos_i;
        float tmp       = tmp_f * cos_i2;
        float 2n_icos_i = 2 * n_i * cos_i;


        float r_parl =  (tmp - (2n_icos_i) + 1) /
                        (tmp + (2n_icos_i) + 1);
        float r_perp =  (tmp_f - (2n_icos_i) + cos_i2) /
                        (tmp_f + (2n_icos_i) + cos_i2);

        return  (r_parl + r_perp) * 0.5;
    }//"Conductors don't transmit light, but some of the incident light is abvsorbed by the material and turnet into heat."(PBR P.H. p.435)

    float fresnel_reflectance for dielectrics(float cos_i, n_i, n_t){
        cos_i = clamp(cos_i,-1.0,1.0);
        //Compute indices of refraction for dielectric
        bool entering = cosi > 0.0;
        if (! entering){
            float aux = n_t;
            n_t = n_i;
            n_i = aux;
        }

        //Compute sint using Snell's law
        float sint = n_i/n_t * sqrt(max(0.0, 1.0 - cos_i * cos_i));

        if(sint >= 1.0){
            return 1.0;
        }else{
            float cos_t = sqrt(max(0.0, 1.0 - sint * sint));
            return fresnel_dielectrics(abs(cos_i), cos_t, n_i,n_t);
        }
    }
    */

    var getVS = function(flags){
        var u = '',
            v = '',
            f = '',
            m = 'attribute vec3 a_vertex;attribute vec3 a_normal;attribute vec2 a_coord;\n';


        m += 'void main(){\n';
        m += 'vec4 position = u_mvp * vec4(a_vertex,1.0);\n';
        m += 'v_vertex = (u_model * vec4(a_vertex,1.0)).xyz;\n';
        m += 'v_normal = (u_model * vec4(a_normal,0.0)).xyz;\n';
        m += 'v_coord = a_coord;\n';
        m += '\n';
        m += 'gl_Position = position;}\n';

        var keys = Object.keys(functions);
        for(var i in keys){
            f+= functions[keys[i]];}
        for(var i in uniforms[0]){
            u+= 'uniform '+uniforms[0][i]+';\n';}
        for(var i in varyings) {
            v+= 'varying '+varyings[i]+';\n';}

        return 'precision highp float;\n'+u+v+f+m;
    }
    var getFS = function(flags){
        var u = '',
            v = '',
            f = '',
            m = '';

        m += 'void main(){\n';

        m += 'vec3 N  = normalize(v_normal);\n';
        m += 'vec3 E  = normalize(u_eye - v_vertex );\n'
        m += 'vec3 R  = reflect(-E, N);\n'; //Perfect reflections on vacuum
        m += 'vec3 H  = normalize( R + E );\n';


        /*m += 'vec3  L     = normalize( u_light_pos);\n';
        m += '      H     = normalize( R + L );\n';
        m += 'float NdotL = dot(N,L);\n';
        m += 'float LdotH = dot(L,H);\n';*/

        m += 'float NdotE = dot(N,E);\n';
        m += 'float NdotH = dot(N,H);\n';
        m += 'float RdotE = dot(R,E);\n';
        m += 'float NdotR = dot(N,R);\n';

        m += 'float cos_i  = dot(E, N);\n'; //Perfect reflections on vacuum
        m += 'float cos_t  = dot(R, N);\n'; //Perfect reflections on vacuum



        //KA
        if(getFlag(flags,_f.MAP_KA)){
              uniforms[1].push('sampler2D u_map_ka_texture');
              m += 'vec4 ka = texture2D(u_map_ka_texture,v_coord);\n';
        }else m += 'vec4 ka = vec4(u_ka.xyz,1.0);\n';

        //KD
        if(getFlag(flags,_f.MAP_KD)){
              uniforms[1].push('sampler2D u_color_texture');
              m += 'vec4 kd = texture2D(u_color_texture, v_coord);\n';
        }else m += 'vec4 kd = vec4(u_color.xyz,1.0);\n';

        //KS
        if(getFlag(flags,_f.MAP_KS)){
              uniforms[1].push('sampler2D u_map_ks_texture');
              m += 'vec4 ks = texture2D(u_map_ks_texture,v_coord);\n';
        }else m += 'vec4 ks = vec4(u_ks.xyz,1.0);\n';

        //KE
        if(getFlag(flags,_f.MAP_KE)){
              uniforms[1].push('sampler2D u_map_ke_texture');
              m += 'vec4 ke = texture2D(u_map_ke_texture,v_coord);\n';
        }else m += 'vec4 ke = vec4(u_ke.xyz,1.0);\n';

        //REFLECTION
        if(getFlag(flags,_f.MAP_R)){
            uniforms[1].push('samplerCube u_reflection_texture');
            m += 'vec4 reflection_color = textureCube(u_reflection_texture,R);\n';
        }else m += 'vec4 reflection_color = vec4(0.0,0.0,0.0,1.0);\n';

        if(getFlag(flags,_f.NS)){
            //uniforms[1].push('float u_glossiness');
            //m += 'reflection_color =  reflection_color * pow( LRdotE, u_glossiness);\n';
        }


        //L_o = L_e(p,w_o) + sum( f(p,w_o,w_i) * L_i(p,w_i) * |cos theta_i| )
/*
        m += '\n';
        m += 'float reflectivity = (ks.x+ks.y+ks.z)*'+(1/3)+';\n';
        m += 'vec4 emisive = ke;\n';
        m += 'vec4 ambient = ka;\n';
        m += 'vec4 diffuse = (kd) * (vec4( 1.0 - fresnel(NdotL, reflectivity, 1.0)) + ambient);\n';
        m += 'vec4 reflection   = reflection_color * fresnel(NdotE, reflectivity, 5.0);\n';
        m += 'vec4 specular     = ((u_glossiness+2.0)/8.0) * vec4(u_light_color,1.0) * fresnel(LdotH, reflectivity, 5.0) * pow(NdotH, u_glossiness) ;\n';




        m += 'vec4 L_out =  emisive + (diffuse + ambient + (specular*0.1) + (reflection*0.9)); \n';*/
        m += '\n';
        m += 'float reflectivity = (ks.x+ks.y+ks.z)*'+(1/3)+';\n';

        m += 'vec4 emisive      = ke;\n';
        m += 'vec4 diffuse      = (kd) * (vec4( 1.0 - fresnel(cos_i, reflectivity, 1.0)));\n';
        m += 'vec4 reflection   = reflection_color * fresnel(cos_t, reflectivity, 5.0) ;\n';
        m += 'vec4 refraction   = vec4(0.0);\n';
        m += 'vec4 incident     = reflection + refraction;\n';

        m += 'vec4 L_out =   emisive + diffuse + incident ; \n';





        if(getFlag(flags,_f.D)){
            uniforms[1].push('float u_opacity');
            m += ' L_out = vec4( L_out.xyz, u_opacity);\n';
        }
        if(getFlag(flags,_f.TR)){
            uniforms[1].push('vec3 u_filter');
            m += ' L_out =  L_out * vec4(u_filter, 1.0));\n';
        }

        m += '\n';
        m += 'gl_FragColor =  L_out;}\n';


        var keys = Object.keys(functions);
        for(var i in keys)          f+= functions[keys[i]]+'\n';
        for(var i in uniforms[1])   u+= 'uniform '+uniforms[1][i]+';\n';
        for(var i in varyings)      v+= 'varying '+varyings[i]+';\n';
        return 'precision highp float;\n'+u+v+f+m;
    }
    gl.shaders[shaderID] = new GL.Shader(getVS(flags),getFS(flags));
    return shaderID;
}