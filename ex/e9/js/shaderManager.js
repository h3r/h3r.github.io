var _f = {
    //Configuration Flags
    T_DIFFUSE_2D : 1, // 0000 0001  //
    T_DIFFUSE_CM : 2, // 0000 0010  //
    T_DIFFUSE    : 3, // 0000 0011   //
    T_SPECULAR_2D: 4, // 0000 0100  //
    T_SPECULAR_CM: 8, // 0000 1000  //
    T_SPECULAR   : 12, // 0000 1000  //
    SKY          : 16,
    ENV          :32
}

function updateFlags(n){
    if(!n.mustUpdateFlags)
        return;

    if(n.flags.val == 'undefined' || n.flags.val == null)
        n.flags.val = 0;
    var aux = null;
    if(n.texture){

        aux = gl.textures[ n.texture ];
        if(!aux){
            return;
        }
        if(aux && aux.texture_type == gl.TEXTURE_2D){
            n.flags.val |= _f.T_DIFFUSE_2D;
            n.flags.val &= ~_f.T_DIFFUSE_CM;
        }
        else if(aux && this.albedo.texture_type == gl.TEXTURE_CUBE_MAP){
            n.flags.val |= _f.T_DIFFUSE_CM;
            n.flags.val &= ~_f.T_DIFFUSE_2D;
        }
    }

    if(n.reflection){
        aux = gl.textures[ n.reflection ];
        if(!aux){
            return;
        }
        if(aux && aux.texture_type == gl.TEXTURE_2D){
            n.flags.val |= _f.T_SPECULAR_2D;
            n.flags.val &= ~_f.T_SPECULAR_CM;
        }
        else if(aux && this.reflection.texture_type == gl.TEXTURE_CUBE_MAP){
            n.flags.val |= _f.T_SPECULAR_CM;
            n.flags.val &= ~_f.T_SPECULAR_2D;
        }
    }
    ShaderManager.getShader(n);
    //n.mustUpdateFlags = false;
};

var ShaderManager = {
    getShader :function (node){
        var shader = null;

        if(node.shader != null && node.shader != 'undefined'){
            shader = loadShader(node.shader);
            if(!shader){
                return gl.shaders['phong'];
            }
            node.mustUpdateFlags = false;
            return shader;
        }

        shader = gl.shaders[node.flags.val || 'basic'];

        if(!shader){
            return this.createShaderWith(node.flags.val);
        }
        node.shader = node.flags.val || 'basic';
        return shader;

    },
    createShaderWith : function(flags){
        var code = this.parse(flags);
        var shader = new GL.Shader(code['vs'], code['fs']);
        gl.shaders[flags || 'basic'] = shader;

        return shader;
    },
    parse: function(flags){
        var vs = '\n\
    precision highp float;\n\ '
            + uniformsVS(flags)
            + varyings(flags)
            + functionsVS(flags) + '\n\
    attribute vec3 a_vertex;\n\
    attribute vec3 a_normal;\n\
    attribute vec2 a_coord;\n\
    void main() {\n\ '
            +mainVS(flags)  +'\n\
    }\n\ ';
        var fs = '\
    #extension GL_EXT_shader_texture_lod : enable\n\
    #extension GL_OES_standard_derivatives : enable\n\
    precision highp float;\n\ '
            + uniformsFS(flags)
            + varyings(flags)
            + functionsFS(flags) + '\n\n\
    void main() {\n\ '
            +mainFS(flags)  +'\n\
    }\n\ ';
        console.log(vs);
        console.log(fs);
        return {vs:vs,fs:fs};
    }
};

function hasRef(flags) {
    return (flags & (_f.T_SPECULAR | _f.ENV) > 0);
}
function uniformsVS(flags){
    var code = '\n\
    uniform mat4 u_view;\n\
    uniform mat4 u_viewprojection;\n\
    uniform mat4 u_model;\n\
    uniform mat4 u_mvp;\n\
    ';
    if( flags & _f.SKY ) code += 'uniform vec3 u_eye;\n\ ';

    return code;
}
function uniformsFS(flags){
    var code = '\n\
    uniform mat4  u_view;\n\
    uniform mat4  u_viewprojection;\n\
    uniform mat4  u_model;\n\
    uniform mat4  u_mvp;\n\
    uniform float u_gamma;\n\
    uniform vec3  u_lightvector;\n\
    uniform vec3  u_lightcolor;\n\
    uniform vec4  u_color;\n\
    uniform vec3  u_eye;\n\
    uniform float u_ref_i;\n\
    ';
    if( flags & _f.T_DIFFUSE_2D )  code+= 'uniform sampler2D    u_color_texture;\n\ ';
    if( flags & _f.T_DIFFUSE_CM )  code+= 'uniform samplerCube  u_color_texture;\n\ ';
    if( flags & _f.T_SPECULAR_2D)  code+= 'uniform sampler2D    u_reflection;\n\ ';
    if( flags & (_f.T_SPECULAR_CM | _f.ENV))  code+= 'uniform samplerCube u_reflection_texture;\n\ ';

    return code;
}
function varyings(flags){
    var code = '\n\
    varying vec3 v_normal;\n\
    varying vec2 v_coord;\n\
    varying vec3 v_vertex;\n\
    varying vec3 v_vertex2;\n\
    varying float depth;\n\
    ';
    return code;
}
function functionsVS(flags){
    var code = '';
    return code;
}
function functionsFS(flags){

    var code = diffuse(flags) + specular(flags);
    code += '\n\
        float fresnel(float cosTheta, float R0, float fresnelPow)\n\
        {\n\
            float facing = (1.0 - cosTheta);\n\
            return max(0.0, R0 + (1.0 - R0) * pow(facing, fresnelPow));\n\
        }\n\ ';

    return code;
}
function diffuse(flags){
    if(flags & _f.T_DIFFUSE_2D ){
        return '\n\
        vec4 diffuse(){\n\
            return texture2D( u_color_texture, v_coord );\n\
        }\n\ ';
    }
    else if( flags & _f.SKY){
        return '\n\
        vec4 diffuse(){\n\
            return textureCube( u_color_texture, vec3(v_vertex.x,v_vertex.y,v_vertex.z) );\n\
        }\n\ ';
    }
    else if( flags & _f.T_DIFFUSE_CM ) {
        return '\n\
        vec4 diffuse(){\n\
            return textureCube( u_color_texture, v_normal );\n\
        }\n\ ';
    }
    else
        return '\n\
        vec4 diffuse(){\n\
            return u_color;\n\
        }\n\ ';
}

function specular(flags){
    if(flags & _f.ENV ){
        /*
         Specular term as defined @ A.W 3D Computer Graphics :217 is
         specular_term = micro-geometry_term (aka reflection index) * shadowing_term * fresnel_term / N*V(glare pow)(DGF/NV)
         * */
        return '\n\
        vec4 specular(vec3 R){\n\
            return textureCube( u_reflection_texture, vec3(R.x,R.y,R.z) ) ;\n\
        }';
    }
    else
        return '\n\
        vec4 specular(vec3 R){\n\
            return vec4(0);\n\
        }\n\ ';
}
function mainVS(flags){
    var code = '\n\
        v_coord  = a_coord;\n\
        v_normal = (u_model * vec4(a_normal,0.0)).xyz;\n\
        v_vertex = (u_model * vec4(a_vertex,1.0)).xyz;\n\
        v_vertex2 = (u_model * u_view * vec4(a_vertex,1.0)).xyz;\n\
        depth = (vec4(v_vertex,1.0) * u_view).z;\n\
        depth *= depth;\n\
        gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
    ';

    return code;
}
function mainFS(flags){
    var code = '\n\
        vec3 L = normalize( u_lightvector - v_vertex);\n\
        vec3 N = normalize(v_normal);\n\
        vec3 V = normalize( v_vertex - u_eye);\n\
		vec3 H = normalize( L + V ); \n\
		vec3 R = reflect(V,N);\n\
		\n\
		float LdotN = max(0.0, dot(L,N));\n\
		float LdotH = max(0.0, dot(L,H));\n\
		float HdotN = max(0.0, dot(H,N));\n\
		float NdotV = max(0.0, dot(N,-V));\n\
		float ref_i = max(u_ref_i, 0.0);\n\
		float gloss = 5.0;\n\
		\n\
		vec4 diffuseTerm  = vec4(0.15)+(1.0 - ref_i) * diffuse() * LdotN;\n\
		vec4 specularTerm = ref_i  * specular(R) * (fresnel(LdotH, ref_i, 5.0) / NdotV) ;\n\
		\n\
		vec4 color =  (diffuseTerm + specularTerm);\n\
	    gl_FragColor = color;\n\ ';
    return code;
}
////vec4( pow(vec3(color.x,color.y,color.z),vec3(u_gamma)),color.w);
//+ textureCube( u_reflection_texture, vec3(R.x,R.y,R.z) )
//

//-------------------------------------------------------------------------------------------------------
function loadCustomShaders(){
    gl.shaders["_normals"] = new GL.Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        varying vec3 v_normal;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\n\
            v_normal = (u_model * vec4(a_normal,0.0)).xyz;\n\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_normal;\
        void main() {\
          vec3 N = normalize(v_normal);\
          gl_FragColor = vec4(((N+vec3(1.0))/vec3(2.0)),1.0);\
        }\
    ');

    gl.shaders["_position"] = new GL.Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        varying vec3 v_vertex;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\n\
            v_vertex = (u_model * vec4(a_vertex,1.0)).xyz;\n\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_vertex;\
        void main() {\
          vec3 V = v_vertex;\
          gl_FragColor = vec4(((normalize(v_vertex)+vec3(1.0))/vec3(2.0)),1.0);//color;\n\
        }\
    ');

    gl.shaders["_depth"] = new GL.Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        varying vec3 v_vertex;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\n\
            v_vertex = (u_model * vec4(a_vertex,1.0)).xyz;\n\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\n\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_vertex;\
        void main() {\
          vec3 V = v_vertex;\
          gl_FragColor = vec4(((vec3(normalize(v_vertex).z)+vec3(1.0))/vec3(2.0)),1.0);//color;\n\
        }\
    ');

}