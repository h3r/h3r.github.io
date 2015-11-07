/*El codigo aun esta acoplado con el parser del scenejs usando el resourceManger, habria que desacoplarlo pero me da pereza ahora mismo*/

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