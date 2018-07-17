# Projects

### **Kristina Project** 

> **tags |** JavaScript, WebGL, GLSL, Animation, Conversational Agents, Gestures, Facial Expressivity, Virtual Characters, BML, Behavior Markup Language

![](https://i.imgur.com/iVwplRf.png)

An Horizon 2020 European Project developed in conjunction many parners of the **Kristina** project. The main goal of the project is to support the user through an online web tool to provide healthcare assistance and information. The  GTI group managed to integrate virtual characters. This virtual characters are capable of proceduraly generate facial expressivity and hand gestures, driven by the BML behavior language.

[ [Official Website](http://kristina-project.eu/en/) | [Video](https://www.youtube.com/watch?v=Vo0t32e_zug) | [CF. Demo]( http://webglstudio.org/users/hermann/kristina/cf)| [SF. Demo](http://webglstudio.org/users/hermann/kristina/sf) | [SM. Demo](http://webglstudio.org/users/hermann/kristina/sm) ]



------

### WPBR: Photorealistic Illumination PBR on the web with WebGL

> **tags |** JavaScript, WebGL, PBR, real-time, GLSL

![img](https://camo.githubusercontent.com/6933b5aaf69a7bf78b74fa1aa795cedfe77aa82b/687474703a2f2f692e696d6775722e636f6d2f3962784e4357782e6a7067)

A real-time Phisically Based Rendering algorithm on the web with webgl.

Phisically Based Rendering (PBR) is an advanced photo-realistic illumination technique that has as goal to simulate as precise as posible the behavior of light, in contraposition to Blinn-Phong shading, when interacting under diferent materials and conditions.

There are techniques as "Image Based Lighting" (IBL) or diferent aproaches of the BRDF that allows to aproximate the final result with a lower cost than raytracing. Despite the counterpart of having les accurate results, the final implementation algorithm can be run under real time scenarios.

The ubicuity of the web, the evolution of the JavaScript engine in browsers and the existence of API's like WebGL, that allows the browser to comunicate directly to the GPU, we can now port and create powerful 3D applications in the context of the browser. The use of shader programs allows the browser to delegate delegate an important part of the compute cost of the algorithm directly to the GPU.

The objective of this project is to implement an interactive render on the web that implements the PBR algorithm using JavaScript and WebGL.

[ [Demo](/wpbr) | [Git](http://github.com/h3r/wpbr) ]



------

### CoolSpace

> **tags**  | C++, OpenGL, Game



![](https://i.imgur.com/QrwM3rb.png)



This is a first aproach to game engines I ever made, made for ***Taller de Jocs Electònics*** in UPF. The game is about how two factions gather and manage resources to comfront each other. Each faction has three types of drones: fighters, defenders, recollectors. How you manage this resources in fighting, deffending or gathering matherial depends on you.

I have focused on the feel of the space environment and how spaceships would maneouver in a space fight. Each drone has a behaviour and a certain actions related to each behaviour like fighting, avoiding attacks, flee, recollect...

The game is developed to be played with a ps3 controller using the motioninjoy tool. Also is required to install few dependencies.

[ [Video](https://www.youtube.com/watch?v=x13r9jsSBOc) | [Git](https://github.com/h3r/CoolSpace) ]



------

### HelloWASM

> **tags**  | C++, WebAssembly, WASM, Emscripten

A simple example of c++ compiled to wasm using emscripten.

[ [Demo](/projects/hellowasm) | [Source](/projects/hellowasm/example.zip) ]



------

### HelloWebGL

> **tags**  | JavaScript, WebGL, GLSL

A "hello world" in webgl with raw opengl calls to display few triangles

[ [Demo](/projects/hellowebgl) | [Source](/projects/hellowebgl/webgl.zip) ]

