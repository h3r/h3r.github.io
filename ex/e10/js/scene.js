//Globals
var resources = {meshes:[],textures:[],shaders:[]};



/*------------------------------------------------------------------------------------------*/
//Parse Scene and load resources
var findChildrenObjects = function(url,callback){
    HttpRequest( url, null, function(data) {
        var line = '',
            lines = data.split("\n");
        var found = [];
        var children = [];

        var string = '';

        var count = [0,0,0];
        var offset = [0,0,0];

        var tokens = [];
        var auxtokens = [];
        var auxline = '';

        for (var lineIndex = 0;  lineIndex < lines.length; ++lineIndex) {
            line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, ""); //trim
            line = line.toLowerCase();
            tokens = line.split(" ");
            if(tokens[0] == 'o'){
                found.push(string);
                offset = count.slice(0);
                string = '';
            };
            if(tokens[0] == 'v')count[0]++;
            if(tokens[0] == 'vt')count[1]++;
            if(tokens[0] == 'vn')count[2]++;

            if(tokens[0] == 'f'){
                auxline = 'f';
                for(var i = 1; i < tokens.length; i++) {
                    var auxtokens = tokens[i].split('/');
                    auxline += ' ';
                    auxline += (auxtokens[0] != '')?(parseInt(auxtokens[0])-offset[0]).toString():'';
                    if(auxtokens.length > 1){
                        auxline += (auxtokens[1] != '')?'/'+(parseInt(auxtokens[1])-offset[1]).toString() : '/';
                        if(auxtokens.length > 2)
                            auxline += (auxtokens[2] != '')?'/'+(parseInt(auxtokens[2])-offset[2]).toString():'/';
                    }
                }
                line = auxline;
            }
            string += line+'\n';
        }
        found.push(string);
        var path = url.substring(0,url.lastIndexOf('/')+1);
        for(var i = 1; i < found.length; i++){
            var mesh = new GL.Mesh(undefined,undefined,undefined,gl);
            mesh = Mesh.parsers["obj"](found[0]+found[i],{mesh:mesh,path:path});
            children.push( mesh );
        }
        if(callback)
            callback(children);
        return children;

    },null);
}

var loadMesh = function(item,callback){
    var node = item[0];
    var aux = item[1].split('_');
    var name        = aux[0].split('.')[0];
    var extension   = aux[0].split('.')[1];
    var md5token    = aux.length == 2 ? aux[1] : '';

    var meshID = md5token ? (name+'_'+md5token) : name;
    var resource =  $scope.renderer.meshes[meshID]  || gl.meshes[meshID] ;
    if(!resource){
        var url =  'meshes/'+name+'.'+extension;
        var fullurl = $scope.renderer.assets_folder + url;
        findChildrenObjects(fullurl,function(children){
            if(children){
                $scope.renderer.meshes[meshID] = children[0];
                node.material = children[0].info.groups[0].material;
                if(children.length>1){
                    for(var i = 1; i < children.length; i++){
                        var child = new RD.SceneNode();

                        child.material = children[i].info.groups[0].material;
                        child.position = node.position || [0,0,0];
                        $scope.renderer.meshes[meshID+'_'+i] = children[i];
                        child.mesh = meshID+'_'+i;
                        node.addChild(child);
                    }
                }
            }
            if(callback)
                callback(true);
        });

        /*$scope.renderer.loadMesh(url,
        function(mesh){
            $scope.renderer.meshes[meshID] = mesh;
            if(callback)
                callback(mesh);
        },gl);*/
    }
    else if(callback){
        callback(resource);
    }
    return resource;
};
var loadTexture = function(item,callback){
    var resource = $scope.renderer.textures[item] ||  gl.textures[item];
    if(!resource){
        $scope.renderer.loadTexture(item, null/*{ wrap: gl.REPEAT, minFilter: gl.LINEAR_MIPMAP_LINEAR }*/,
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
    var resource = $scope.renderer.shaders[item] || gl.shaders[item];
    if(!resource){
        $scope.renderer.loadShaders(item,
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

var matId = 0;
function parseScene(scene,sceneFile,callback){
    sceneFile = sceneFile || getUriParams().scene;
    if(!sceneFile || !scene)
        return false;

    var success = function(sceneGraph){
        sceneGraph = JSON.parse(sceneGraph);
        var cameras = [],
            nodes = [],
            node = null,
            material = null;
        resources = {meshes:[],textures:[],shaders:[]};
        gl.materials = gl.materials || {};
        if(sceneGraph.light)
            $custom.light.pos = sceneGraph.light;
        if(sceneGraph.materials){
            for(var i in sceneGraph.materials) {
                material = sceneGraph.materials[i];

                material.ka = material.ka || [0.0,0.0,0.0];
                material.kd = material.kd || [1.0,1.0,1.0];
                material.ks = material.ks || [0.0,0.0,0.0];
                material.ke = material.ke || [0.0,0.0,0.0];
                material.r  = material.r  || 0.0;

                gl.materials[material.name || 'unknown-mat_'+matID++] = sceneGraph.materials[i];

                if(material.map_bump)resources.textures.push(material.map_bump);
                if(material.map_ka)  resources.textures.push(material.map_ka);
                if(material.map_kd)  resources.textures.push(material.map_kd);
                if(material.map_ks)  resources.textures.push(material.map_ks);
                if(material.map_r)   resources.textures.push(material.map_r);
                if(material.map_d)   resources.textures.push(material.map_d);
                if(material.bump)    resources.textures.push(material.bump);
                if(material.disp)    resources.textures.push(material.disp);
            }
        }
        if(sceneGraph.nodes) {

            for (var i in sceneGraph.nodes) {
                node = sceneGraph.nodes[i];
                switch (node.type) {
                    case "camera":
                        var cam = new RD.Camera();
                        if (node.camera_type == 'perspective')
                            cam.perspective(node.fov || 45, node.aspect || gl.canvas.width / gl.canvas.height, node.near || 0.01, node.far || 10000);
                        if (node.camera_type == 'orthographic')
                            cam.orthographic(node.frustum || 100, node.near || 0.01, node.far || 10000, node.aspect || 1)

                        cam.lookAt(node.eye, node.center, node.up);
                        scene.cameras = scene.cameras || [];
                        scene.cameras.push(cam);
                        break;
                    case "mesh":
                        scene.root.addChild(new MeshNode(node));
                        break;
                    case "skybox":
                        scene.envmap = new SkyboxNode(node);
                        break;
                    case "plane":
                        scene.root.addChild(new PlaneNode(node));
                        break;
                    case "plane2D":
                        scene.root.addChild(new Plane2DNode(node));
                        break;
                    case "point":
                        scene.root.addChild(new PointNode(node));
                        break;
                    case "cube":
                        scene.root.addChild(new CubeNode(node));
                        break;
                    case "box":
                        scene.root.addChild(new BoxNode(node));
                        break;
                    case "circle":
                        scene.root.addChild(new CircleNode(node));
                        break;
                    case "cylinder":
                        scene.root.addChild(new CylinderNode(node));
                        break;
                    case "sphere":
                        scene.root.addChild(new SphereNode(node));
                        break;
                    case "grid":
                        scene.root.addChild(new GridNode(node));
                        break;
                    case "icosahedron":
                        scene.root.addChild(new IcosahedronNode(node));
                        break;
                    default:
                        throw ("unknown node type: " + node.type);
                }
            }
        }
        ResourceLoader(resources,allLoaded);

        function allLoaded(check){
            $scope.camera = $scope.scene.cameras[0] || $scope.camera;
            if(check)
                throw 'Error while loading resources.';
            if(callback)
                callback(cameras,nodes);
        }
    };
    var error = function(e){
        throw 'Parse error: '+e;
    }

    return HttpRequest('./scenes/'+sceneFile+'.json',null, success, error, null);
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
            if(ko > 0)
                console.log(ko+'/'+total+': errors on items: '+errors)
            else
                console.log(ok+'/'+total+': resources loaded');

            callback(ko>0);
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
    this.n.flags.value = 0;
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

    for(var i in node.uniforms){
        this.n._uniforms[i] = node.uniforms[i];
    }

    if(node.shader)
        resources.shaders.push(node.shader);

    this.n.texture  = node.texture  || null; //todo mirar del mtl

    if(node.material)
        this.n.material = node.material;

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
    resources.meshes.push([this.n,nodeConfig.mesh+md5Token]);

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
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.cube(nodeConfig.mesh_options);

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
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.plane(nodeConfig.mesh_options);

    return this.n;
}

function Plane2DNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "plane2D"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.plane2D(nodeConfig.mesh_options);

    return this.n;
}

function PointNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "point"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.point(nodeConfig.mesh_options);

    return this.n;
}

function CubeNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "cube"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.cube(nodeConfig.mesh_options);

    return this.n;
}


function BoxNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "box"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.box(nodeConfig.mesh_options);

    return this.n;
}


function SphereNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "sphere"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.sphere(nodeConfig.mesh_options);

    return this.n;
}

function CircleNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "circle"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.circle(nodeConfig.mesh_options);

    return this.n;
}

function CylinderNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "cylinder"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.cylinder(nodeConfig.mesh_options);

    return this.n;
}

function SphereNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "sphere"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.sphere(nodeConfig.mesh_options);

    return this.n;
}

function GridNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "grid"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.grid(nodeConfig.mesh_options);

    return this.n;
}

function IcosahedronNode(nodeConfig){
    nodeConfig = nodeConfig || {};
    nodeConfig.mesh_options = nodeConfig.mesh_options || {size:1};

    DecoNode.apply(this,arguments);

    var meshID = "icosahedron"+object2md5(nodeConfig.mesh_options);
    this.n.mesh = meshID;
    if(!$scope.renderer.meshes[meshID])
        $scope.renderer.meshes[meshID] = GL.Mesh.icosahedron(nodeConfig.mesh_options);

    return this.n;
}

/*------------------------------------------------------------------------------------------*/
