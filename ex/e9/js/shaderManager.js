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
    precision highp float;\n\ '
        + uniformsFS(flags)
        + varyings(flags)
        + functionsFS(flags) + '\n\n\
    void main() {\n\ '
        +mainFS(flags)  +'\n\
    }\n\ ';
        //console.log(vs);
        //console.log(fs);
        return {vs:vs,fs:fs};
    }
};

function hasRef(flags) {
    return (flags & _f.T_SPECULAR > 0);
}
function uniformsVS(flags){
    var code = '\n\
    uniform mat4  u_view;\n\
    uniform mat4  u_viewprojection;\n\
    uniform mat4  u_model;\n\
    uniform mat4  u_mvp;\n\
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
    ';
    if( flags & _f.T_DIFFUSE_2D )  code+= 'uniform sampler2D u_color_texture;\n\ ';
    if( flags & _f.T_DIFFUSE_CM )  code+= 'uniform samplerCube u_color_texture;\n\ ';
    if( flags & _f.T_SPECULAR_2D)  code+= 'uniform sampler2D u_reflection;\n\ ';
    if( flags & (_f.T_SPECULAR_CM | _f.ENV))  code+= 'uniform samplerCube u_reflection_texture;\n\ uniform vec3  u_eye;\n\ uniform float u_ref_i;\n\ ';

    return code;
}
function varyings(flags){
    var code = '\n\
    varying vec3 v_normal;\n\
    varying vec2 v_coord;\n\
    varying vec3 v_vertex;\n\
    ';
    return code;
}
function functionsVS(flags){
    var code = '';
    return code;
}
function functionsFS(flags){
    var code = diffuse(flags) + specular(flags);
    return code;
}
function diffuse(flags){
    if(flags & _f.T_DIFFUSE_2D ){
        return '\n\
        vec4 diffuse(){\n\
            return texture2D( u_color_texture, v_coord );\n\
        }';
    }
    else
        return '\n\
        vec4 diffuse(){\n\
            return u_color;\n\
        }\n\ ';
    /*var code = '\
            vec4 diffuse(){\
            float LdotN = dot(normalize(u_lightvector),normalize(v_normal));\
            return ';
    if( flags & _f.T_DIFFUSE_2D )      { code += 'texture2D( u_albedo, v_coord ) * LdotN ;\ ';}
    else if( flags & _f.SKY)           { code += 'textureCube( u_albedo, vec3(v_vertex.x,v_vertex.y,v_vertex.z) ) ;\ '      }
    else if( flags & _f.T_DIFFUSE_CM ) { code += 'textureCube( u_albedo, v_normal ) * LdotN ;\ ';}
    else                               { code += 'u_color;\ ';}

    code += ' }\ ';*/
}

function specular(flags){
    if(flags & _f.ENV ){
        return '\n\
        vec4 specular(){\n\
            vec3 E = v_vertex - u_eye;\n\
            vec3 R = reflect(E,normalize(v_normal));\n\
            return textureCube( u_reflection_texture, vec3(R.x,R.y,R.z) ) ;\n\
        }';
    }
    else
        return '\n\
        vec4 specular(){\n\
            return vec4(0);\n\
        }\n\ ';
}
function mainVS(flags){
    var code = '\n\
        v_coord  = a_coord;\n\
        v_normal = (u_model * vec4(a_normal,0.0)).xyz;\n\
        v_vertex = (u_model * vec4(a_vertex,1.0)).xyz;\n\
        gl_Position = u_mvp * vec4(a_vertex,1.0); ';

    return code;
}
function mainFS(flags){
    var code = '\n\
        vec3 N = normalize(v_normal);\n\
		vec3 L = normalize(u_lightvector- v_vertex);\n\
		float LdotN = dot(N,L);\n\
		vec4 color = (diffuse() + specular()) * 0.5 * max(0.0,LdotN);\n\
	    gl_FragColor = vec4(pow(color.xyz,vec3(1.0/2.2)),0.0);\n\ ';
     return code;
}
////vec4( pow(vec3(color.x,color.y,color.z),vec3(u_gamma)),color.w);
//+ textureCube( u_reflection_texture, vec3(R.x,R.y,R.z) )
