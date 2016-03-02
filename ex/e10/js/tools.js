function getUriParams(){
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

function object2md5(config){
    if( Object.keys(config).length == 0)
        return '';
    var sortedConfig = sort(config);
    config = JSON.stringify(sortedConfig);
    if(typeof config != 'string')
        throw 'object2md5 : something went wrong';
    return md5(config);
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

function flagOn     (flags, flag){ return flags |= flag ; }
function flagOff    (flags, flag){ return flags &= ~flag; }
function flagSwitch (flags, flag){ return flags ^= flag ; }
function getFlag    (flags, flag){ return (flags & flag)>0}

function fadeOut(selector,val){ if(isNaN(val)){ val = 9;}
    document.querySelector(selector).style.opacity='0.'+val;
    //For IE
    document.querySelector(selector).style.filter='alpha(opacity='+val+'0)';
    if(val>0){
        val--;
        setTimeout('fadeOut("'+selector+'",'+val+')',90);
    }else{return;}
}

function fadeIn(selector,val){
// ID of the element to fade, Fade value[min value is 0]
    if(isNaN(val)){ val = 0;}
    document.querySelector(selector).style.opacity='0.'+val;
    //For IE
    document.querySelector(selector).style.filter='alpha(opacity='+val+'0)';
    if(val<9){
        val++;
        setTimeout('fadeIn("'+selector+'",'+val+')',90);
    }else{return;}
}
function blurCubemap( texture , blur_texture )
{
    var num = $custom.blur || 1;

    if(!blur_texture)
        blur_texture = texture.clone();
    for(var i = 0; i < num; i++)
    {
        var old = texture; //swap
        texture = texture.applyBlur(i,i, 1, null, blur_texture);
        blur_texture = old;
    }
}

var cubemapCam = new RD.Camera();
cubemapCam.perspective( 90, 1, 0.1, 10000 );
function genEnvMap(selfnode,position,tex,callback){
    //function getCubemapAt(position,tex,selfnode,callback){
        if(!tex)
            tex = new GL.Texture(128,128, { texture_type: gl.TEXTURE_CUBE_MAP, minFilter: gl.NEAREST, magFilter: gl.NEAREST });
        var cam = $scope.camera;
        tex.drawTo(function(texture,face)
        {

            var eye = position;
            var dir = Texture.cubemap_camera_parameters[face].dir;
            var center = vec3.add(vec3.create(),dir,eye);
            var up =  Texture.cubemap_camera_parameters[face].up;

            dir = [-dir[0],-dir[1],-dir[2]];
            center = vec3.add($temp.vec3,dir,eye);
            up = [up[0],-up[1],-up[2]];

            cubemapCam.lookAt(eye,center, up);

            $scope.camera = cubemapCam;
            $scope.context.ondraw();

            return;

        });
        $scope.camera = cam;

        if(callback)
            callback(tex);
        return tex;

}