
parseSceneGraphJson = function (renderer,scene, ifile , callback){
    var json = $.get(ifile,parseSceneGraph);

    function parseSceneGraph(sceneGraph){
        var cameras = []
        var nodes = [];
        var node = null;
        try {
            for (var i in sceneGraph.nodes) {
                node = sceneGraph.nodes[i];
                switch (node.type) {
                    case "camera":
                        var cam = new RD.Camera();
                        cam[node.camera_type]( node.fov || 45, node.aspect || gl.canvas.width / gl.canvas.height, node.near || 1, node.far || 1000 );
                        cam.lookAt( node.eye, node.center, node.up );
                        cameras.push(cam);
                        break;
                    case "mesh":
                        //todo
                        break;
                    case "skybox":
                        renderer.meshes["sky"] = GL.Mesh.cube({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "plane2D";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "plane":
                        renderer.meshes["plane"] = GL.Mesh.plane({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "plane";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "plane2D":
                        renderer.meshes["plane2D"] = GL.Mesh.plane2D({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "plane2D";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "point":
                        renderer.meshes["point"] = GL.Mesh.point({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "point";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "cube":
                        renderer.meshes["cube"] = GL.Mesh.cube({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "cube";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "box":
                        renderer.meshes["box"] = GL.Mesh.box({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "box";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "circle":
                        renderer.meshes["circle"] = GL.Mesh.circle({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "circle";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "cilinder":
                        renderer.meshes["cilinder"] = GL.Mesh.cilinder({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "cilinder";
                        n.texture = "mytexture.jpg"; //todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);
                        break;
                    case "sphere":
                        renderer.meshes["sphere"] = GL.Mesh.sphere({size:1});
                        var n = new RD.SceneNode();
                        n.color = node.color ||[1,0,0,1];
                        n.mesh = "sphere";
                        n.texture = "mytexture.jpg";//todo mirar del mtl
                        n.shader = node.shader || "phong";
                        n.position = node.position || [0,0,0];
                        n.scale(vec3.fromValues(node.size,node.size,node.size) || [1,1,1]);
                        nodes.push(n);


                        break;
                    case "grid":
                        break;
                    case "icosahedron":
                        break;
                    default:
                        trow ("unknown node type: "+node.type);
                }
            }
        }catch(e){
            console.error('@parseSceneGraph: '+e);
        }

        if(callback)
            callback(cameras,nodes);
    }


}
