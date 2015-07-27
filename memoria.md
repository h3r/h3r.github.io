
[return](/)
> **Nota:** No, no me he matado a hacer una web, es markdown plano auto-publicado, hecho con [**stackedit.io**](https://stackedit.io)

#**TFG**: Physically based rendering over web technologies
######  {#autor}

<div class="pagebreak"></div>
-----------------------------------------------------------

#Index
[TOC]

-----------------------------------------------------------

<div class="pagebreak"></div>
#1 **Funcionamiento del Pipeline**
![](http://malideveloper.arm.com/downloads/deved/tutorial/SDK/android/2.0/pipeline.png)

Documentación OpenGL ES[^1:docmentacion]

---

##1.1 la API: *OpenGL*
No vamos a meternos de pleno, OpenGL es una librería que hace de puente entre nuestro código y la tarjeta gráfica.

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
![](http://www.cores2.com/3D_Tutorial/_images/CubeVertices.png)
El modo en que esta información ha de ser interpretada va directamente ligado a la primitiva que hayamos definido:

- **Puntos**: Solo se tiene en cuenta cada vértice individualmente.
- **Lineas**: Se interpreta la información a pares de vértices, lo cual forma una linea
- **Triangulos**: La primera de las primitivas poligonales, la información se procesa por paquetes de tres vértices, lo cual forma la superficie mínima, cuyos vértices serán siempre coplanares. Tenemos diferentes flags para la misma primitiva:

	- **GL_TRIANGLES**:  Se interpreta el vertex buffer como triángulos independientes,no comparten vértice alguno con ningún otro triángulo.
	- **GL_TRIANGLE_STRIP**: Los triángulos están contectados, los vértices pueden pertenecer a diferentes superficies/triángulos.
	- **GL_TRIANGLE_FAN**: El primer vertice define el centro de la geometria y cada par de vertices que añadimos añade un triangulo al objeto.
	
		![](http://black-byte.com/wp-content/uploads/2007/01/triangulos.png)
		<small>Primitivas en OpenGL ES[^1.2:primitivas]


##1.3 Vertex Processing : el vertex shader

El Vertex Shader es el primer modulo que vamos a encontrar en el pipeline encargado de definir el comportamiento con el que la gpu tiene que procesar los vértices. Su ejecución se realiza exclusivamente una vez por cada vértice que recibe.  La información que tiene disponible se limita a la del vértice que esta siendo procesado (posicion, normal, uv) y las variables que podamos haber cargado desde nuestra CPU denominadas *Uniforms*.

El prefijo ***uniform*** hace referencia a unos datos cargados en memoria que son constantes inalterables durante toda la ejecución del renderizado y, por lo tanto, por cada ejecución del vertex shader por cada vértice que reciba por entrada dispondrá de los mismos valores.

 




---

##1.4 Primitive Assembly

---

##1.5 Rasterizer

---

##1.6 Fragment Shader

#N Texturas

















<div class="pagebreak"></div>
<!-- anexos -->

---

#Enlaces
[^1:docmentacion]:Documentación OpenGL ES @ [**kronos.org**](https://www.khronos.org/registry/gles/specs/2.0/es_cm_spec_2.0.24.pdf)

[^1.2:primitivas]: Primitivas en OpenGL ES@ [**Black-Byte**](http://black-byte.com/tutorial/primitivas-en-opengl/)
