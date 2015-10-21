//Globals
var placer  = null;
var ctx     = null;
var renderer= null;
var scene   = null;
var camera  = null;
var node = null;

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
    renderer.loadShaders("shaders.txt",function(){
        parseSceneGraphJson((getUriParams().s || 'sun')+'.json', parseCallback);
    });

    function parseCallback(cameras){
        console.log('parseCallback');
        camera = cameras[0];
        renderer.render(scene, camera , scene);
        $('canvas').fadeIn("slow");
        ctx.animate();
    }

	//user input
	ctx.onmousemove = function(e)
	{
		if(e.dragging)
		{
			camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
			//scene._root.children[0].rotate( e.deltax * -0.01, RD.UP );
		}
	}
	
	ctx.onmousewheel = function(e)
	{
		camera.position = vec3.scale( camera.position, camera.position, e.wheel < 0 ? 1.1 : 0.9 );
	}
	
	ctx.captureMouse(true);

    ctx.ondraw = function(){

        renderer.clear([0.3,0.3,0.3,1]);
        renderer.render(scene, camera);
    }

    ctx.onupdate = function(dt)
    {

        scene.update(dt);
    }



}