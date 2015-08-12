function loadShader (urlvs,urlfs,options,callback,gl){
    var aux = urlvs.substr(urlvs.lastIndexOf("/")+1, urlvs.length-1);
    var url = aux.substr(0, aux.lastIndexOf("."));
    if(typeof gl.shaders[url] != 'undefined'){
        console.log('shader loaded from cache');
        if(callback)
            callback(gl.shaders[url]);
        return gl.shaders[url];
    }
    console.log('shader loaded from source');
    gl.shaders[url] = GL.Shader.fromURL(urlvs, urlfs,callback);
    return gl.shaders[url];
}

function loadTexture (url,options,callback,gl){
    var aux = url.substr(url.lastIndexOf("/")+1, url.length-1);
    var url2 = aux.substr(0, aux.lastIndexOf("."));
    if(typeof gl.textures[url2] != 'undefined'){
        console.log('texture loaded from cache');
        if(callback)
            callback(gl.textures[url2]);
        return gl.textures[url2];
    }
    console.log('texture loaded from source');
    gl.textures[url2] = GL.Texture.fromURL(url,options,callback,gl);
    return gl.textures[url2];
}

function loadMesh (url,options,callback,gl){
    var aux = url.substr(url.lastIndexOf("/")+1, url.length-1);
    var url2 = aux.substr(0, aux.lastIndexOf("."));
    if(typeof gl.meshes[url2] != 'undefined'){
        console.log('mesh loaded from cache');
        if(callback)
            callback(gl.meshes[url2]);
        return gl.meshes[url2];
    }
    console.log('mesh loaded from source');
    gl.meshes[url2] = GL.Mesh.fromURL(url,options,callback,gl);
    return gl.meshes[url2];
}


function ResourceLoader(list,callback,gl){
    var ok = 0;
    var ko = 0;
    var total = list.length;
    var errors = new Array();


    var checkAllLoaded = function() {
        if (ok + ko == total ) {
            (ko > 0)?console.log(ko+'/'+total+': errors on items: '+errors) : console.log(ok+'/'+total+': resources loaded');
            callback();
        }
    };

    var onload = function() {
        ok++;
        checkAllLoaded();
    };

    var onerror = function(string) {
        ko++;
        errors.push(string);
        checkAllLoaded();
    };

    for(var i in list){
        var item = list[i];

        if(item instanceof Array){
            loadShader(item[0],item[1],{},function(shader){
                (shader)? onload() : onerror(item);
            },gl);

        }else{
            loadTexture(item,{},function(tex){
                (tex)? onload() : onerror(item);
            },gl);
        }

    }
}