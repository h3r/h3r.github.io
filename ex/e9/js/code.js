var placer  = null;
var ctx     = null;
var renderer= null;
var scene   = null;
var camera  = null;


function init()
{
	//create a scene
	scene = new RD.Scene();

	//create the rendering context
    placer = document.getElementById('canvas-container');
	ctx = GL.create({width:placer.clientWidth, height:placer.clientHeight});
	renderer = new RD.Renderer(ctx);
    placer.appendChild( renderer.canvas ); //attach

    //Parse scene from file
    renderer.setDataFolder("data");
    renderer.loadShaders("shaders.txt");
    parseSceneGraphJson('sun.json', parseCallback);
    var node = null;
    function parseCallback(cameras, nodes){
        console.log('parseCallback');
        camera = cameras[0];
        node = nodes[0];
        renderer.render(scene, camera , nodes);
        $('canvas').fadeIn("slow");
        ctx.animate();
    }

	//user input
	ctx.onmousemove = function(e)
	{
		if(e.dragging)
		{
			camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
			node.rotate( e.deltax * 0.01, RD.UP );
		}
	}
	
	ctx.onmousewheel = function(e)
	{
		camera.position = vec3.scale( camera.position, camera.position, e.wheel < 0 ? 1.1 : 0.9 );
	}
	
	ctx.captureMouse(true);

    ctx.ondraw = function(){
        renderer.clear([0.1,0.1,0.1,1]);
        renderer.render(scene, camera);
    }

    ctx.onupdate = function(dt)
    {
        scene.update(dt);
    }



}