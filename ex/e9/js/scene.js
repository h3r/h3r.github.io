

function ResourceLoader(list,callback){
    list.meshes     = list.meshes   || [];
    list.textures   = list.textures || [];
    list.shaders    = list.shaders  || [];
    var ok = 0;
    var ko = 0;
    var total = list.meshes.length + list.textures.length + list.shaders.length ;
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

    var load_callback = function(el){
        (el)? onload() : onerror(el);
    };

    for(var i in list.meshes){
        loadMesh(list.meshes[i],load_callback);
    }
    for(var i in list.textures){
        loadTexture(list.textures[i],load_callback);
    }
    for(var i in list.shaders){
        loadShader(list.shaders[i],load_callback);
    }
}

var loadMesh = function(item,callback){
    var aux = item.split('_');
    var name        = aux[0].split('.')[0];
    var extension   = aux[0].split('.')[1];
    var md5token    = aux.length == 2 ? aux[1] : '';

    var meshID = md5token ? (name+'_'+md5token) : name;

    if(!renderer.meshes[meshID]){
        renderer.loadMesh('meshes/'+name+'.'+extension,
        function(mesh){
            renderer.meshes[meshID] = mesh;
            if(callback)
                callback(mesh);
        },gl);
    }
    else if(callback){
        callback(resource);
    }
};
var loadTexture = function(item,callback){
    var resource = gl.textures[item];
    if(!resource){
        renderer.loadTexture(item, { wrap: gl.REPEAT, minFilter: gl.LINEAR_MIPMAP_LINEAR },
        function(tex){
            gl.textures[item] = tex;
            if(callback)
                callback(tex);
         });
    }
    else if(callback){
        callback(resource);
    }
};
var loadShader = function(item,callback){
    var resource = gl.shaders[item];
    if(!resource){
        console.log(this,renderer,ctx);
        renderer.loadShaders(item,
        function(shader){
            gl.shaders[item] = shader;
            if(callback)
                callback(shader);
        });
    }
    else if(callback){
        callback(resource);
    }
};

parseSceneGraphJson = function (ifile , callback){
    var json = $.get(ifile,parseSceneGraph);
    function parseSceneGraph(sceneGraph){
        var cameras  = []
        var nodes    = [];
        var node     = null;
        resources = {meshes:[],textures:[],shaders:[]}
        //try {
            for (var i in sceneGraph.nodes) {
                node = sceneGraph.nodes[i];
                switch (node.type) {
                    case "camera":
                        var cam = new RD.Camera();
                        if(node.camera_type == 'perspective')
                            cam.perspective( node.fov || 45, node.aspect || gl.canvas.width / gl.canvas.height, node.near || 0.1, node.far || 1000 );
                        if(node.camera_type == 'orthographic')
                            cam.orthographic(node.frustum || 100, node.near || 0.1, node.far || 1000, node.aspect || 1)

                        cam.lookAt( node.eye, node.center, node.up );
                        cameras.push(cam);
                        break;
                    case "mesh":
                        scene.root.addChild( new MeshNode(node) );//todo
                        break;
                    case "skybox":
                        scene.root.addChild( new SkyboxNode(node) );
                        break;
                    case "plane":
                        scene.root.addChild( new PlaneNode(node) );
                        break;
                    case "plane2D":
                        scene.root.addChild( new Plane2DNode(node) );
                        break;
                    case "point":
                        scene.root.addChild( new PointNode(node) );
                        break;
                    case "cube":
                        scene.root.addChild( new CubeNode(node) );
                        break;
                    case "box":
                        scene.root.addChild( new BoxNode(node) );
                        break;

                    case "circle":

                        node.mesh_options = node.mesh_options || {size:1};
                        renderer.meshes["circle"] = GL.Mesh.circle(node.mesh_options);
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "circle";
                        n.texture = node.texture || null; //todo mirar del mtl
                        if(n.texture)
                            resources.textures.push(n.texture);
                        n.shader = node.shader || "phong";
                        if(n.shader)
                            resources.shaders.push(n.shader);
                        n._uniforms = node._uniforms || n._uniforms || {};
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        scene.root.addChild(n);
                        break;

                    case "cilinder":
                        node.mesh_options = node.mesh_options || {size:1};
                        renderer.meshes["cilinder"] = GL.Mesh.cilinder(node.mesh_options);
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "cilinder";
                        n.texture = node.texture || null; //todo mirar del mtl
                        if(n.texture)
                            resources.textures.push(n.texture);
                        n.shader = node.shader || "phong";
                        if(n.shader)
                            resources.shaders.push(n.shader);
                        n._uniforms = node._uniforms || n._uniforms || {};
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        scene.root.addChild(n);
                        break;

                    case "sphere":
                        node.mesh_options = node.mesh_options || {size:1};
                        renderer.meshes["sphere"] = GL.Mesh.sphere(node.mesh_options);
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "sphere";
                        n.texture = node.texture || null; //todo mirar del mtl
                        if(n.texture)
                            resources.textures.push(n.texture);
                        n.shader = node.shader || "phong";
                        if(n.shader)
                            resources.shaders.push(n.shader);
                        n._uniforms = node.uniforms || n._uniforms || {};
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        //nodes.push(n);
                        scene.root.addChild(n);
                        break;

                    case "grid":
                        break;

                    case "icosahedron":
                        break;

                    default:
                        trow ("unknown node type: "+node.type);
                }
            }
        //}catch(e){
          //  console.error('@parseSceneGraph: '+e);
        //}
        function allLoaded(){
            if(callback)
                callback(cameras);
        }
        ResourceLoader(resources,allLoaded);
    }


}
