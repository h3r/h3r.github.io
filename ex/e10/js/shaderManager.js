
var shaderManager = {
    setUniforms : function(node){
        if(node.ambient)        node._uniforms.u_ka = node.ambient;
        if(node.specularity)    node._uniforms.u_ks = node.specularity;

        if(node.glossiness)     node._uniforms.u_glossiness = node.glossiness;
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

            }


            if(node.flags.value == undefined)
                node.flags.value = 0;
            if(node.textures.map_ka) node.flags.value = flagOn(node.flags.value,_f.MAP_KA);
            if(node.textures.color)  node.flags.value = flagOn(node.flags.value,_f.MAP_KD);
            if(node.textures.map_ks) node.flags.value = flagOn(node.flags.value,_f.MAP_KS);



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
    MAP_R   :  8, // 0000 1000  //
    NS      : 16, // 0001 0000  //
    IOR     : 32, // 0010 0000  //
    D       : 64, // 0100 0000  //
    TR      :128, // 1000 0000  //

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
                    ['vec3 u_eye','vec3 u_light_pos', 'vec4 u_light_color', 'vec3 u_ka', 'vec4 u_color', 'vec3 u_ks']];
    var varyings = ['vec3 v_vertex','vec3 v_normal','vec2 v_coord'];
    var functions = {};

    if(getFlag(flags,_f.IOR)){
        var f = 'float fresnel(float cosTheta, float R0, float fresnelPow){';
        f+= 'float facing = (1.0 - cosTheta); ';
        f+= 'return max(0.0, R0 + (1.0 - R0) * pow(facing, fresnelPow));}';

        functions['fresnel'] = f;
    }

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

        m += 'vec3 N = normalize(v_normal);\n';
        m += 'vec3 L = normalize(u_light_pos);\n';
        m += 'vec3 E = normalize(v_vertex - u_eye);\n'
        m += 'vec3 R = reflect(E, N);\n';
        m += 'vec3 LR = reflect(L, N);\n';
        m += 'float NdotL = max(0.0,dot(L,N));\n';
        m += 'float LRdotE = max(0.0,dot(LR,E));\n';

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

        //REFLECTION
        if(getFlag(flags,_f.MAP_R)){
            uniforms[1].push('samplerCube u_reflection_texture');
            m += 'vec4 reflection_color = textureCube(u_reflection_texture,vec3(R.x,R.y,R.z));\n';
        }else m += 'vec4 reflection_color = vec4(1.0,0.0,1.0,1.0);\n';

        if(getFlag(flags,_f.NS)){
            uniforms[1].push('float u_glossiness');
            m += 'vec4 reflection_pow =   pow( vec4(vec3(reflection_color.x+reflection_color.y+reflection_color.z*'+1/3+'),reflection_color.w), vec4(u_glossiness));\n';
        }

        m += '\n';
        m += 'float reflectivity = (ks.x+ks.y+ks.z)*'+(1/3)+';\n';
        m += 'vec4 ambient = ka;\n';
        m += 'vec4 diffuse = kd * vec4(1.0-reflectivity);\n';
        m += 'vec4 specular = reflection_color * reflectivity;\n';
        m += 'vec4 color = ambient +( diffuse + specular) ;// * NdotL;\n';

        if(getFlag(flags,_f.D)){
            uniforms[1].push('float u_opacity');
            m += 'color = vec4(color.xyz, u_opacity);\n';
        }
        if(getFlag(flags,_f.TR)){
            uniforms[1].push('vec3 u_filter');
            m += 'color = color * vec4(u_filter, 1.0));\n';
        }

        m += '\n';
        m += 'gl_FragColor = color;}\n';


        var keys = Object.keys(functions);
        for(var i in keys)          f+= functions[keys[i]]+'\n';
        for(var i in uniforms[1])   u+= 'uniform '+uniforms[1][i]+';\n';
        for(var i in varyings)      v+= 'varying '+varyings[i]+';\n';
        return 'precision highp float;\n'+u+v+f+m;
    }
    gl.shaders[shaderID] = new GL.Shader(getVS(flags),getFS(flags));
    return shaderID;
}