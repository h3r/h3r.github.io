function getUriParams()
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    var params = {};
    var length = vars.length;
    for (var i=0;i<length;i++) {
        var pair = vars[i].split("=");
        params[pair[0]] =  decodeURI(pair[1]);
    }
    return params;
}

function sort(object){
    if (typeof object != "object" || object instanceof Array) // Not to sort the array
        return object;
    var keys = Object.keys(object);
    keys.sort();
    var newObject = {};
    for (var i = 0; i < keys.length; i++){
        newObject[keys[i]] = sort(object[keys[i]])
    }
    return newObject;
}

function object2md5(config){
    if(typeof a != 'object' || keys(a).length == 0)
        return '';
    var sortedConfig = sort(config);
    config = JSON.stringify(sortedConfig);
    if(typeof config != 'string')
        throw 'object2md5 : something went wrong';
    return md5(config);
}

function flagOn     (flags, flag){ return flags |= flag ; }
function flagOff    (flags, flag){ return flags &= ~flag; }
function flagSwitch (flags, flag){ return flags ^= flag ; }
function getFlag    (flags, flag){ return (flags & flag)>0}


var tex = null;
var cubemapCam = new RD.Camera();
cubemapCam.perspective( 90, 1, 0.1, 10000 );

function getCubemapAt(position,tex,selfnode,callback){
    if(!tex)
        tex = new GL.Texture(256,256, { texture_type: gl.TEXTURE_CUBE_MAP, minFilter: gl.NEAREST, magFilter: gl.NEAREST });

    tex.drawTo(function(texture,face)
    {
        var eye = position;
        var dir = Texture.cubemap_camera_parameters[face].dir;
        var center = vec3.add(vec3.create(),dir,eye);
        var up =  Texture.cubemap_camera_parameters[face].up;

        renderer.clear([0.00,0.00,0.00,1]);
        ctx.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        cubemapCam.lookAt(eye, center, up);

        if(selfnode){
            renderer.render(scene, cubemapCam,scene._root.children.filter(function(node){return node != selfnode;}));
        }
        else
            renderer.render(scene, cubemapCam);
        selfnode._uniforms.u_cm_center = position;


        return;

    });
    if(callback)
        callback(tex);
    return tex;
};

function blur(tex_in,level,tex_levels){
    console.log(level)
    if(level <= 0)
        return tex_levels;
    //0tempTex = GL.Texture.fromTexture(tex_in);
    tex_in.drawTo(function(texture,face){
        var eye = [1,0,1];

        var dir = Texture.cubemap_camera_parameters[face].dir;
        var center = vec3.add(vec3.create(),dir,eye);
        var up =  Texture.cubemap_camera_parameters[face].up;
        cubemapCam.lookAt(eye, center, up);

        renderer.clear([0.00,0.00,0.00,1]);
        ctx.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        renderer.render(scene2, cubemapCam);

        //return;
    });
    var out_tex = tex_in;
    tex_levels.push(out_tex);

    blur(out_tex, --level, tex_levels);
}
var tempTex = null;
function blurTexture(tex_in,levels,callback){

    if(!tex_in)
        return undefined;
    //gl.textures[n.textures.reflection] = tex_in;
    tex_in.drawTo(function(texture,face){
        var eye = [1,1,-1];
        var dir = Texture.cubemap_camera_parameters[face].dir;
        var center = vec3.add(vec3.create(),dir,eye);
        var up =  Texture.cubemap_camera_parameters[face].up;
        cubemapCam.lookAt(eye, center, up);

        renderer.clear([0.00,0.00,0.00,1]);
        ctx.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        renderer.render(scene2, cubemapCam);

        return;
    });

    if(callback)
        callback(tex_in);
    return tex_in;
}

function blurasas(tex,levels,callback){
    if(!gl.textures['cnode_'+ levels])
        gl.textures['cnode_'+ levels] = new GL.Texture(128,128, { texture_type: gl.TEXTURE_CUBE_MAP, minFilter: gl.NEAREST, magFilter: gl.NEAREST });

    gl.textures['creflection'] = tex;
    updateFlags(cnode);
    gl.textures['cnode_'+ levels].drawTo(function(texture_rendered,face)
    {
        var eye = [0,0,-10];
        var dir = Texture.cubemap_camera_parameters[face].dir;
        var center = vec3.add(vec3.create(),dir,eye);
        var up =  Texture.cubemap_camera_parameters[face].up;
        cubemapCam.lookAt(eye, center, up);

        renderer.clear([0.00,0.00,0.00,1]);
        ctx.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        renderer.render(scene2, cubemapCam);

        return;
    });

    tex_levels.push(gl.textures['cnode_'+ levels]);

}
