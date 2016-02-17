/*=============================================
/ Global Usage Variables
/============================================*/
var placer  = null;
var ctx     = null;
var renderer= null;
var scene   = null;
var camera  = null;
var node    = null;
var scene2 = null;
var cnode = null;


var tempVec3 = vec3.create();


function init()
{
    /*=============================================
    / Initial Setup : Scene & Rendering Context
    /============================================*/
	scene = new RD.Scene();
    placer = document.getElementById('canvas-container');
    ctx = GL.create({width:placer.clientWidth, height:placer.clientHeight});
    GL.Mesh.getScreenQuad(gl);
    renderer = new RD.Renderer(ctx);
    renderer._uniforms.u_lightvector = vec3.fromValues(0,25,0);
    renderer.setDataFolder("data");

    placer.appendChild( renderer.canvas ); //attach

    //Parse scene from file
    loadCustomShaders();
    renderer.loadShaders("shaders.txt",function(){
        parseSceneGraphJson((getUriParams().s || 'sun')+'.json', parseCallback);
    });
    function parseCallback(cameras){
        console.log('parseCallback');
        camera = cameras[0];
        renderer.render(scene, camera , scene);

        scene2 = new RD.Scene();
        cnode = new CubeNode({})

        cnode.textures.reflection = 'creflection';
        cnode.flags.flip_normals = true;
        cnode.flags.two_sided = true;
        cnode.color = [0,0,1,1];
        ShaderManager.getShader(cnode);
        scene2.root.addChild( cnode );

        $('canvas').fadeIn("slow");
        ctx.animate();
    }


    /*=============================================
    / Window Resie Handler
    /============================================*/
    var resize = function() {

        ctx.canvas.width   = placer.clientWidth;
        ctx.canvas.height  = placer.clientHeight;
        if(camera)
            camera.perspective(camera.fov, placer.clientWidth / placer.clientHeight, camera.near, camera.far);
        ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);

    };
    window.onresize = resize;
    resize();


    /*=============================================
    / User Input Handling
    /============================================*/
    ctx.captureMouse(true);
	ctx.onmousemove = function(e)
	{
        if (e.dragging) {
            if (e.leftButton)
            {
                camera.orbit(-e.deltax *  0.005, RD.UP, camera._target );
                camera.orbit(-e.deltay *  0.005, camera._right, camera._target );
            }
            if (e.rightButton)
            {
                var dx = e.deltax * 0.05;
                var dy = e.deltay * 0.05;
                camera.move( vec3.mul([0,0,0],camera._right,[-dx,-dx,-dx]) );  //camera.pan(vec3.fromValues(e.deltax * - 0.0325, e.deltay * - 0.0325, 0) );
                camera.move( vec3.mul([0,0,0],camera._top,  [dy,dy,dy]) );
            }
        }
	}
	ctx.onmousewheel = function(e)
	{
		vec3.scale( tempVec3, vec3.sub([0,0,0],camera.position,camera._target), e.wheel < 0 ? 1.01 : 0.99 );
        vec3.add(camera.position, camera._target, tempVec3 );
	}

    /*=============================================
    / Render Event Callback Functon
    /============================================*/
    ctx.ondraw = function()
    {
        renderer.clear([0.00,0.00,0.00,1]);
        ctx.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        if(window.layers != ''){
            renderer.shader_overwrite = window.layers;
            scene.root.postRender = function(renderer){renderer.shader_overwrite = null;};
        }
        renderer.render(scene, camera);
    };

    /*=============================================
    / Update Event Callback Functon
    /============================================*/
    ctx.onupdate = function(dt)
    {

        scene._root.getVisibleChildren().map(function(n){

            updateFlags(n,function(n){
                if(n.flags.val & _f.ENV) {
                    getCubemapAt(n.position,gl.textures['reflection_'+ n._uid],n,function(tex){
                        n.textures.reflection = 'reflection_'+ n._uid;
                        blurTexture(tex,3,function(blur_tex){
                            gl.textures[n.textures.reflection] = blur_tex;
                        });
                    });

                    renderer._uniforms.u_eye = camera.position;
                }
            });

        });
        scene._root.getVisibleChildren().map(function(n){

            if(n.flags.val & _f.ENV && n.textures.reflection) {

                //xgl.textures[n.textures.reflection] = blurTexture(n.textures.reflection,3);
                renderer._uniforms.u_eye = camera.position;

            }
        });

        scene.update(dt);
    }


}

