
var loadMesh = function(item,callback){
    var aux = item.split('_');
    var name        = aux[0].split('.')[0];
    var extension   = aux[0].split('.')[1];
    var md5token    = aux.length == 2 ? aux[1] : '';

    var meshID = md5token ? (name+'_'+md5token) : name;
    var resource = renderer.meshes[meshID];
    if(!resource){
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
    return resource;
};
var loadTexture = function(item,callback){
    var resource = gl.textures[item];
    if(!resource){
        renderer.loadTexture(item, null/*{ wrap: gl.REPEAT, minFilter: gl.LINEAR_MIPMAP_LINEAR }*/,
            function(tex){
                gl.textures[item] = tex;
                if(callback)
                    callback(tex);
            });
    }
    else if(callback){
        callback(resource);
    }
    return resource;
};
var loadShader = function(item,callback){
    var resource = gl.shaders[item];
    if(!resource){
        renderer.loadShaders(item,
            function(shader){
                gl.shaders[item] = shader;
                if(callback)
                    callback(shader);
            });
        return null;
    }
    else if(callback){
        callback(resource);
    }
    return resource;
};

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

function parseScene(sceneFile,om_complete){
    var json = $.get(sceneFile || getUriParams().scene,function(sceneGraph){
        var cameras = [],
            nodes = [],
            node = null,
            resources = {meshes:[],textures:[],shaders:[]};

        for(var i in sceneGraph.nodes){
            node = sceneGraph.nodes[i];
            switch (node.type) {
                case "camera":
                    var cam = new RD.Camera();
                    if(node.camera_type == 'perspective')
                        cam.perspective( node.fov || 45, node.aspect || gl.canvas.width / gl.canvas.height, node.near || 0.01, node.far || 10000 );
                    if(node.camera_type == 'orthographic')
                        cam.orthographic(node.frustum || 100, node.near || 0.01, node.far || 10000, node.aspect || 1)

                    cam.lookAt( node.eye, node.center, node.up );
                    cameras.push(cam);
                    break;
                case "mesh":
                    scene.root.addChild( new MeshNode(node) );
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
                    scene.root.addChild( new CircleNode(node) );
                    break;
                case "cylinder":
                    scene.root.addChild( new CylinderNode(node) );
                    break;
                case "sphere":
                    scene.root.addChild( new SphereNode(node) );
                    break;
                case "grid":
                    scene.root.addChild( new GridNode(node) );
                    break;
                case "icosahedron":
                    scene.root.addChild( new IcosahedronNode(node) );
                    break;
                default:
                    throw ("unknown node type: "+node.type);
            }
        }
    });
}

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

function AbstractNode(){
    this.n = new RD.SceneNode();

    var node = arguments[0];
    this.n.position = node.position || [0,0,0];
    this.n.flags.val = node.flags || 0;
    this.n.mustUpdateFlags = true;
}

//Props
function PropNode(){
    AbstractNode.apply(this,arguments);
    //PropNode initialization
}

//Decos
function DecoNode(){
    AbstractNode.apply(this,arguments);
    //DecoNode initialization
    var node = arguments[0];

    this.n.color    = node.color    || [1,1,1,1];

    this.n.shader   = node.shader   || null;

    this.n._uniforms.u_ref_i = 0.0;
    for(var i in node.uniforms){
        this.n._uniforms[i] = node.uniforms[i];
    }

    if(node.shader)
        resources.shaders.push(node.shader);

    this.n.texture  = node.texture  || null; //todo mirar del mtl
    if(node.texture)
        resources.textures.push(node.texture);

    if(node.size)
        this.n.scaling  = node.size instanceof Array? [node.size[0],node.size[1],node.size[2]] : [node.size,node.size,node.size];

    if(node.rotation){
        this.n.rotate( (node.rotation[1] || 0) * DEG2RAD, [0,1,0]);
        this.n.rotate( (node.rotation[0] || 0) * DEG2RAD, [1,0,0]);
        this.n.rotate( (node.rotation[2] || 0) * DEG2RAD, [0,0,1]);
    }

}

//Zones
function ZoneNode(){
    AbstractNode.apply(this,arguments);
    //ZoneNode initialization
}
//Camera
function CameraNode(){
    AbstractNode.apply(this,arguments);
    //CameraNode initialization
}



/*------------------------------------------------------------------------------------------*/


function MeshNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    if(!nodeConfig.mesh)
        return null;

    DecoNode.apply(this,arguments);

    var md5Token = object2md5(nodeConfig.mesh_options);
    md5Token = md5Token == ''? md5Token : '_'+md5Token;
    this.n.mesh = nodeConfig.mesh.split('.')[0]+md5Token;
    resources.meshes.push(nodeConfig.mesh+md5Token);

    return this.n;
}

/**
 * Creates a new skybox node based on arguments passed
 */
function SkyboxNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "sky"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.cube(nodeConfig.mesh_options);

    flagOn(this.n.flags, _f.SKY);
    return this.n;
}

/**
 * Creates a new plane node based on arguments passed
 */
function PlaneNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "plane"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.plane(nodeConfig.mesh_options);

    return this.n;
}

function Plane2DNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "plane2D"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.plane2D(nodeConfig.mesh_options);

    return this.n;
}

function PointNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "point"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.point(nodeConfig.mesh_options);

    return this.n;
}

function CubeNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "cube"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.cube(nodeConfig.mesh_options);

    return this.n;
}


function BoxNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "box"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.box(nodeConfig.mesh_options);

    return this.n;
}


function SphereNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "sphere"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.sphere(nodeConfig.mesh_options);

    return this.n;
}

function CircleNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "circle"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.circle(nodeConfig.mesh_options);

    return this.n;
}

function CylinderNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "cylinder"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.cylinder(nodeConfig.mesh_options);

    return this.n;
}

function SphereNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "sphere"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.sphere(nodeConfig.mesh_options);

    return this.n;
}

function GridNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "grid"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.grid(nodeConfig.mesh_options);

    return this.n;
}

function IcosahedronNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "icosahedron"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!renderer.meshes[meshID])
        renderer.meshes[meshID] = GL.Mesh.icosahedron(nodeConfig.mesh_options);

    return this.n;
}

/*------------------------------------------------------------------------------------------*/
