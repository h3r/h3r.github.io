var smf = { //Configuration Flags
    T_DIFFUSE_2D : 1, // 0000 0001  //
    T_DIFFUSE_CM : 2, // 0000 0010  //
    T_DIFFUSE    : 3, // 0000 0011   //
    T_SPECULAR_2D: 4, // 0000 0100  //
    T_SPECULAR_CM: 8, // 0000 1000  //
    T_SPECULAR   : 12, // 0000 1000  //
    SKY          : 16
};

function hasRef(flags) {
    return (flags & smf.T_SPECULAR > 0);
}

function uniformsVS(flags){
    console.log(flags);
    var code = 'uniform mat4 u_mvp; uniform mat4 u_model; ';
    if( flags & smf.SKY ) code += 'uniform vec3 u_eye;';
    return code;
}
function uniformsFS(flags){
    var code = 'uniform float u_gamma; uniform vec4 u_color; uniform vec3 u_light; ';

    if( flags & smf.T_DIFFUSE_2D )  code+= 'uniform sampler2D u_albedo; ';
    if( flags & smf.T_DIFFUSE_CM )  code+= 'uniform samplerCube u_albedo; ';
    if( flags & smf.T_SPECULAR_2D)  code+= 'uniform sampler2D u_reflection; ';
    if( flags & smf.T_SPECULAR_CM)  code+= 'uniform samplerCube u_reflection;uniform vec3 u_eye;uniform float u_ref_i; ';
    return code;
}
function varyings(flags){
    var code = 'varying vec3 v_normal; ';
    if( flags & smf.T_DIFFUSE ) code+= 'varying vec2 v_coord; ';
    if( flags & (smf.T_DIFFUSE | smf.T_SPECULAR) ) code+= 'varying vec3 v_vertex; ';
    return code;
}

function diffuse(flags){
    var code = '\
            vec4 diffuse(){\
            float LdotN = dot(normalize(u_light),normalize(v_normal));\
                return ';
    if( flags & smf.T_DIFFUSE_2D )      { code += 'texture2D( u_albedo, v_coord ) * LdotN '+(hasRef()?' * u_ref_i':'')+';\ ';}
    else if( flags & smf.SKY)           { code += 'textureCube( u_albedo, vec3(v_vertex.x,v_vertex.y,v_vertex.z) ) '+(hasRef()?' * u_ref_i':'')+';\ '      }
    else if( flags & smf.T_DIFFUSE_CM ) { code += 'textureCube( u_albedo, v_normal ) * LdotN '+(hasRef()?' * u_ref_i':'')+';\ ';}
    else                                { code += 'vec4(0)'+(hasRef()?' * u_ref_i':'')+';\ ';}

    code += ' }\ ';

    return code;
}

function specular(flags){
    var code = '\
        vec4 specular(){\ ';
    if( flags & smf.T_SPECULAR_CM )
    {
        code +='vec3 E = v_vertex - u_eye;\
                vec3 R = reflect(E,normalize(v_normal));\ ';
        if( flags & smf.SKY) {
            code += 'vec4 color = textureCube( u_reflection, vec3(R.x,R.y,-R.z) )' + (hasRef() ? ' * (1 - u_ref_i)' : '') + ';\ ';
        }else
            code += 'vec4 color = textureCube( u_reflection, vec3(R.x,R.y,R.z) )' + (hasRef() ? ' * (1 - u_ref_i)' : '') + ';\ ';
    }
    else
    {   code += 'vec4 color = vec4(0);\ ';}

    code += ' return color;\
    }\ ';

    return code;
}

var ShaderManager = {
    load: function (flags) {
        if (gl.shaders[flags]) {
            return gl.shaders[flags];
        }
        console.log(flags);
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
            if( flags & smf.T_SPECULAR || flags & smf.SKY) vs += ' v_vertex = a_vertex;\ ';
            vs += ( flags & smf.SKY)?'gl_Position = u_mvp * vec4(vec3(a_vertex.x + u_eye.x,a_vertex.y + u_eye.y,  -(a_vertex.z - u_eye.z)),1.0);}'
            : 'gl_Position = u_mvp * vec4(a_vertex,1.0);\ }';

        var fs = '\
        precision highp float;\ '
         + uniformsFS(flags)
         + varyings(flags)
         + diffuse(flags)
         + specular(flags)
         +'void main(){\
           	vec4 color =  vec4(u_color.xyz * ( (diffuse().xyz) + specular().xyz),1.0);\
            gl_FragColor = vec4( pow(vec3(color.x,color.y,color .z),vec3(u_gamma)),color.w);}';
        console.log(vs);
        console.log(fs);
        return {vs:vs,fs:fs};
    }
};