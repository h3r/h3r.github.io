

#**TFG**: Physically based rendering over web technologies
######  {#autor}

<div class="pagebreak"></div>
-----------------------------------------------------------

#Index {#index}
[TOC]

-----------------------------------------------------------

<div class="pagebreak"></div>
#1 **Funcionamiento del Pipeline**
>![Programmable Pipeline](http://malideveloper.arm.com/downloads/deved/tutorial/SDK/android/2.0/pipeline.png)
Documentación OpenGL ES[^1:docmentacion]

##1.1 la API: *OpenGL*
No vamos a meternos de pleno, OpenGL es una librería que proporciona una serie de métodos y atributos con los que podemos modificar y definir el funcionamiento de la gpu.

A partir de la versión OpenGL 2.0, se cambia la logica del fixed pipeline y se permite introducir “hacks” para en forma de pequeños programas para modificar el funcionamiento de diferentes fases del pipeline. Pero ya entraremos más adelante con los shaders.

La API nos permite pasar al toda una serie información básica ssobre el modo que se realiza el renderizado como:

Nos permite asignar y subir a la gráfica información básica sobre el modo que se realiza el renderizado

> - La primitiva con la que vamos a interpretar los VertexBuffers
> - Arraybuffers con información de los vértices:  el Vertex Buffer
>  - R<sup>3</sup> :: posición 
>  - R<sup>3</sup> :: vector normal
>  - R<sup>2</sup> :: coordenadas de textura *uv*
>  - R<sup>4</sup> :: color rgba
>- Flags para cambiar ciertos parámetros
>  - ***Depth Test*** : habilitar / deshabilitar la oclusión entre objetos de la escena 
>  - ***Alpha Blending*** : habilitar / deshabilitar la transparencia
>  - ***Clear Color***: establecer el color de fondo con el que vamos a pintar
>- Mapas de textura de tipo:
>  - **texturas 2D** : texturas normales, shadow maps, bump maps.... Se utiliza un par de coordenadas R<sup>2</sup>::*uv* para mapear su contenido.
>  - **texturas 3D**: *cubemaps*, *environment maps*... Se utiliza un vector  R<sup>3</sup> para mapear su contenido.

---

##1.2 Primitive Processing 

Tras haber subido la información relacionada con los objetos en forma de arraybuffers a la memoria *gddr* de la tarjeta gráfica, se prepara la información para su renderizado. 
Los arraybuffers, en el siguiente ejemplo el vertex buffer, es un array de array que contiene las coordenadas 3D de cada vertice de la malla:

``` javascript
vertexBuffer = 
[
	[ 0.0, 0.0, 1.0 ],
	[ 1.0, 0.0, 1.0 ],
	[ 1.0, 1.0, 1.0 ],
	[ 0.0, 1.0, 1.0 ],
	[ 0.0, 0.0, 0.0 ],
	[ 1.0, 0.0, 0.0 ],
	[ 1.0, 1.0, 0.0 ],
	[ 0.0, 1.0, 0.0 ]
]
```
>![Vertices en un cubo](http://www.cores2.com/3D_Tutorial/_images/CubeVertices.png)

El modo en que esta información ha de ser interpretada va directamente ligado a la primitiva que hayamos definido:

- **Puntos**: Solo se tiene en cuenta cada vértice individualmente.
- **Lineas**: Se interpreta la información a pares de vértices, lo cual forma una linea
- **Triangulos**: La primera de las primitivas poligonales, la información se procesa por paquetes de tres vértices, lo cual forma la superficie mínima, cuyos vértices serán siempre coplanares. Tenemos diferentes flags para la misma primitiva:

	- **GL_TRIANGLES**:  Se interpreta el vertex buffer como triángulos independientes,no comparten vértice alguno con ningún otro triángulo.
	- **GL_TRIANGLE_STRIP**: Los triángulos están contectados, los vértices pueden pertenecer a diferentes superficies/triángulos.
	- **GL_TRIANGLE_FAN**: El primer vertice define el centro de la geometria y cada par de vertices que añadimos añade un triangulo al objeto.
	
		>![Primitivas](http://black-byte.com/wp-content/uploads/2007/01/triangulos.png)
		<small>Primitivas en OpenGL ES[^1.2:primitivas]


##1.3 Vertex Processing : el vertex shader

El Vertex Shader es el primer modulo que vamos a encontrar en el pipeline encargado de definir el comportamiento con el que la gpu tiene que procesar los vértices, en concreto, **definir cuales son las coordenadas de pantalla que el pixel ocupa**.

Su ejecución se realiza exclusivamente una vez por cada vértice que recibe.  La información que tiene disponible se limita a la del vértice que esta siendo procesado (posicion, normal, uv) y las variables que podamos haber cargado desde nuestra CPU denominadas *Uniforms*.

El prefijo ***uniform*** hace referencia a unos datos cargados en memoria que son constantes inalterables durante toda la ejecución del renderizado y, por lo tanto, por cada ejecución del vertex shader por cada vértice que reciba por entrada dispondrá de los mismos valores.

 Adicionalmente podemos definir unas variables de salida, una variables denominadas (en esta versión) ***varyings***. El funcionamiento o objetivo de las *varyings* es pasar información al ***fragment shader***. El valor obtenido en el *fragment shader* es el resultado de la interpretación lineal entre los diferentes vértices de la primitiva procesada.   Las *varyings* pueden ser de tipo **float, vec2, vec3, vec4, mat2, mat3, mat4** y arrays de los respectivos. 

Un uso muy común de las varyings suele ser para definir el color que recibirá un pixel.

>![Interpolacion lineal de color](http://3.bp.blogspot.com/-kgKg2kiBvD0/TarT8eoeV9I/AAAAAAAAAaI/-P36pCTG56s/s1600/BilinearGradient.png)
><small>Interpolacion lineal del color definido en cada vértice del quad.

---

##1.4 Primitive Assembly

---

##1.5 Rasterizer

Entendemos por Raserizado 3D como el método que permite proyectar y pintar sobre un plano 2D( la pantalla ) un modelo 3D.

La primera fase del rasterizado se trata en proyectar las coordenadas 3D de cada vértice en el plano 2D de la pantalla. Para ello hacemos uso de una serie de matrices de cambio de base, en concreto queremos transformar los ejes de coordenadas del espacio global a un eje de coordenadas de cámara, donde el front de la cámara define la profundidad y el top y el right el eje de ordenadas y abscisas respectivamente. Es importante esta transformación ya que nos permitirá almacenar la profundidad de cada punto en el espacio, obteniendo el Z-Buffer que posteriormente podemos utilizar para detectar oclusiones (que objeto queda ocluido por la presencia de otro).

El segundo paso se trata de traducir estas coordenadas de cámara a un plano 2D de un tamaño fijo que es nuestra pantalla, alineada con los ejes de ordenadas y abscisas de la cámara. Para ello recorreremos secuencialmente vértice de cada cara de cada objeto de la escena y los pintaremos en pantalla. Además guardaremos la coordenada z del vértice y lo almacenaremos en un buffer que tiene el mismo tamaño de la pantalla que estamos pintando y registramos ,a profundidad con valor entre 0 y 1. Usualmente el 0 hace referencia a la distancia a la que se encuentra el near plane (el plano más cercano que limita el espacio que renderizamos) y el 1 a la distancia del far plane (el plano más alejado).

Tras haber situado la posición en pantalla de cada vértice, se procede a pintar las aristas.

Para pintar un punto de la arista lo que lo que vamos a hacer es calcular la pendiente de la recta que une los dos pixeles correspondientes a los vértices. Tras saber la posición que corresponde al nuevo punto de la arista consultamos primero el Z-buffer, si el valor de profundidad es más pequeño que el valor registrado en el Z-buffer el pixel se ve, sino este queda oculto y permanece el color ya existente.
Una vez terminado de pintar las aristas pasamos a pintar el interior de la geometría. Vamos a ir fila a fila y pintaremos todo aquello que este entre pares de pixeles ya pintados.

>![](http://www.codeproject.com/KB/GDI/3DSoftwareRenderingEngine/scanlinerasterizer.png)

Una vez que sabemos si podemos pintar o no un pixel, el fixed pipeline de la tarjeta gráfica nos permite escoger un modelo de iluminación local para obtener el color final que corresponde al píxel.

---

##1.6 Fragment Shader

#Z Fresnel Term

#A Texturas

#AA CubeMaps

#AAA Blur
##AAA.1 Descripción básica de la técnica
El término inglés ***'blur'***, en español 'difuminado', hace referencia a la técnica de filtro pictográfica que tiene como fin desdibujar los colores y contornos de una imagen. Este tipo de filtro tiene aplicaciones como la simulacion de movimiento en imagenes estàticas, mejorar la detección de contornos de una imagen

>![](https://udn.epicgames.com/Three/rsrc/Three/MotionBlurSoftEdge/SoftEdgeFan.jpg)
><small>El desenfoque de las aspas sugiere el movimiento circular de este.

<!---->

>![](https://upload.wikimedia.org/wikipedia/commons/7/73/Edge_Image.gif)
><small>Al desenfocar la imagen original, desaparecen los detalles y prevalecen los contornos más relevantes.

Para este proyecto, queremos localizar e implementar alguna técnica de desenfoque por tal de simular la granulosidad del material.

>![](https://upload.wikimedia.org/wikipedia/commons/6/62/Cappadocia_Gaussian_Blur.svg)
><small>El desenfoque gausiano utiliza una convolución de los píxeles colindantes dado un peso concreto, de este modo el píxel central es el que más peso tiene y se va difuminando a medida que nos alejamos de forma simétrica.
<!---->









<div class="pagebreak"></div>
<!-- anexos -->

---

#Enlaces
[^1:docmentacion]:Documentación OpenGL ES @ [**kronos.org**](https://www.khronos.org/registry/gles/specs/2.0/es_cm_spec_2.0.24.pdf)

[^1.2:primitivas]: Primitivas en OpenGL ES@ [**Black-Byte**](http://black-byte.com/tutorial/primitivas-en-opengl/)

