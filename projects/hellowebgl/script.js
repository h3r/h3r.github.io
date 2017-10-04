//Now, inside of a "script" tag the browsers will assume its coded in JavaScript language.

//JavaScript is quite fast to develop, all variables are called objects and those are
//instanced using "var" (there is no need to say this is an integuer, this is a float, etc...)

/*You may use inline comments like the previous one, or multi-line comments like this one.
The same you may have seen before in C/C++
For more info about HTML and JavaScript i suggest you to visit my teaching webpage with some
resources collected about the topic: https://h3r.github.io/teaching */

//Some globals
var canvas, gl, shader;
var bg = vec4.create(0.0, 0.0, 0.0, 1.0);

function initializeGL() {
    canvas = document.getElementById("my-canvas-ID");
    gl = canvas.getContext("webgl");

    if (!gl)
        throw ("Oops!We got some troubles trying to initialize WebGL.");

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function loadShader(gl, type, source) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        //The shader could not be compiled
        var error = gl.getShaderInfoLog(shader);
        if (error.length > 0) {
            gl.deleteShader(shader);
            throw error;
        }


    }
    return shader;
}

function createShaderProgram(gl, vs, fs) {
    //Create shader
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);

    //Create program
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

initializeGL();

//Create some geometry description
var vertex_positions =
    [0.5, -0.5, 0.0,
        0.5, 0.5, 0.0,
        -0.5, 0.5, 0.0,
        -0.5, -0.5, 0.0,
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.0, 0.5, 0.0];

var per_vertex_color =
    [1.0, 0.0, 0.0,  //0
        1.0, 0.0, 0.0,  //1
        1.0, 0.0, 0.0,  //2
        1.0, 0.0, 0.0,  //3
        0.0, 0.0, 1.0,  //4
        0.0, 0.0, 1.0,  //5
        1.0, 0.0, 0.0];//6

var index = [0, 1, 6, 6, 1, 2, 6, 2, 3, 6, 4, 5];



//We have to initialize this data in the way the GPU expects it.
var positionBuffer = gl.createBuffer();                                             //a buffer is like an unformatted multi purpouse array.
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);                                     //now we say, we are going to store data in this "positionBuffer" and its contents wil be arranged as an "array_buffer"
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_positions), gl.STATIC_DRAW); //the data we are goind to store is a series of of Float32 values, and this specific array is not going to change too much

var colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(per_vertex_color), gl.STATIC_DRAW);

var indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);

//Create our shader program
var files = {};
loadFiles(files, ["shader.vs", "shader.fs"], {
    callback: function (data) {

        var vertex_shader_file = files["shader.vs"];
        var fragment_shader_file = files["shader.fs"];
        shader = createShaderProgram(gl, vertex_shader_file, fragment_shader_file);

        draw();
    }
});






function draw() {
    if (!gl)
        return;

    gl.clearColor(bg.x, bg.y, bg.z, bg.a);               // Set background color               
    gl.enable(gl.DEPTH_TEST);                            // Enable depth testing 
    gl.depthFunc(gl.LEQUAL);                             // Define how depth behaves, near objects oclude far object               
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear both buffers before painting

    //Now we ned to tell webgl how to pull the data out from the positions buffer, color buffer, etc...
    //Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        gl.getAttribLocation(shader, "a_vertex"),
        3,          //our 3D vertex has 3 components to locate them in space
        gl.FLOAT,   //they are formated as floats
        false,      //we can say if we want them to be normalized or not (from -1 to 1)
        0,          //how many bytes to get from one set of values to the next (mayb you have vertex,normal,color,vertex,normal,color... in a single buffer)
        0           //offset to start from, like if we want normals in a vertex,normal,color we would want to skip vertex in the first iteration.
    );
    gl.enableVertexAttribArray(gl.getAttribLocation(shader, "a_vertex"));

    //Color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        gl.getAttribLocation(shader, "a_color"),
        3,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(gl.getAttribLocation(shader, "a_color"));

    //Index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    //tell webgl to use our shader program when drawing
    gl.useProgram(shader);

    //Set shader uniforms
    /*
        gl.uniformMat...
    */

    gl.drawElements(gl.TRIANGLES, index.length /*index count*/, gl.UNSIGNED_SHORT, 0 /*offset*/)
}

requestAnimationFrame(drawScene);