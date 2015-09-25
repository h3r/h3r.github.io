var smf = { //Configuration Flags
    T_DIFFUSE_2D : 1, // 0000 0001  //
    T_DIFFUSE_CM : 2, // 0000 0010  //
    T_DIFFUSE    : 3, // 0000 0011   //
    T_SPECULAR_2D: 4, // 0000 0100  //
    T_SPECULAR_CM: 8, // 0000 1000  //
    T_SPECULAR   : 12 // 0000 1000  //
};

function hasRef(flags) {
    return (flags & smf.T_SPECULAR) != 0;
}

function uniformsVS(flags){
    var code = 'uniform mat4 u_mvp; uniform mat4 u_model; ';
    return code;
}
function uniformsFS(flags){
    var code = 'uniform float u_gamma; uniform vec4 u_color; uniform vec3 u_light; ';

    if( flags & smf.T_DIFFUSE_2D )  code+= 'uniform sampler2D u_albedo; ';
    if( flags & smf.T_DIFFUSE_CM )  code+= 'uniform samplerCube u_albedo; ';
    if( flags & smf.T_SPECULAR_2D)  code+= 'uniform sampler2D u_reflection; ';
    if( flags & smf.T_SPECULAR_CM)  code+= 'uniform samplerCube u_reflection; ';
    return code;
}
function varyings(flags){
    var code = 'varying vec3 v_normal; ';
    if( flags & smf.T_DIFFUSE_2D ) code+= 'varying vec2 v_coord; ';
    if( flags & (smf.T_DIFFUSE | smf.T_SPECULAR_CM) ) code+= 'varying vec3 v_vertex; ';
    return code;
}

function diffuse(flags){
    var code = '\
            vec4 diffuse(){\
                return ';
    if( flags & smf.T_DIFFUSE_2D )      {code += 'texture2D( u_albedo, v_coord );\ ';}
    else if( flags & smf.T_DIFFUSE_CM ) {code += 'textureCube( u_albedo, v_normal );\ ';}
    else                                {code += 'vec4(1);\ ';}

    code += ' }\ ';

    return code;
}

function specular(flags){
    var code = '\
        vec4 specular(){\
        return ';
    if( flags & smf.T_SPECULAR_2D )
    {   code += 'texture2D( u_reflection, v_coord );\ ';}
    else if( flags & smf.T_SPECULAR_CM )
    {
        code +='vec3 E = v_vertex - u_eye;\
                vec3 R = reflect(E,N);\
                textureCube( u_reflection, R );\ ';
    }
    else
    {   code += 'vec4(0);\ ';}

    code += ' }\ ';

    return code;
}

var ShaderManager = {
    load: function (flags) {
        if (gl.shaders[flags]) {
            return gl.shaders[flags];
        }
        return this.createShaderWith(flags);
    },
    createShaderWith: function (flags) {
        var code = this.parse(flags);
        var shader = new Shader(code['vs'], code['fs']);
        gl.shaders[flags] = shader;
        return shader;
    },
    parse: function (flags) {

        var vs = '\
        precision highp float;\ '
        +uniformsVS(flags)
        +varyings(flags)  +'\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        attribute vec2 a_coord;\
        \
        void main(){\ \
            v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
            ';
            if( flags & smf.T_DIFFUSE ) vs += 'v_coord  = a_coord;\ ';
            if( flags & smf.T_SPECULAR) vs += ' v_vertex = a_vertex;\ ';
            vs += 'gl_Position = u_mvp * vec4(a_vertex,1.0);\
        }';
        var fs = '\
        precision highp float;\ '
         + uniformsFS(flags)
         + varyings(flags)
         + diffuse(flags)
         + specular(flags)
         +'void main(){\
            float LdotN = dot(normalize(u_light),normalize(v_normal));\
           	vec4 color =  vec4(u_color.xyz * ( (diffuse().xyz * LdotN) + specular().xyz),1.0);\
            gl_FragColor = vec4(pow(color.xyz,vec3(u_gamma)),color.w);\
        }';
        console.log(vs,fs);
        return {vs:vs,fs:fs};
    }
};