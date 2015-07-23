
[return](/)

> **Nota:** No, no me he matado a hacer una web, es markdown plano auto-publicado, hecho con [**stackedit.io**](https://stackedit.io)

#**TFG**: Physically based rendering over web technologies
######  {#autor}

<div class="page-break-after"></div>
-----------------------------------------------------------

#Index
[TOC]

-----------------------------------------------------------

#1 **Funcionamiento del Pipeline**
![](http://malideveloper.arm.com/downloads/deved/tutorial/SDK/android/2.0/pipeline.png)

Documentación OpenGL ES[^1:a]



##1.1 la API: *OpenGL*
No vamos a meternos de pleno, OpenGL es una librería que hace de puente entre nuestro código y la tarjeta gráfica. 

A partir de la versión OpenGL 2.0, se cambia la logica del fixed pipeline y se permite introducir "hacks" para en forma de pequeños programas para modificar el funcionamiento de diferentes fases del pipeline. Pero ya entraremos más adelante con los shaders.

La API nos permite pasar al toda una serie  información básica ssobre el modo que se realiza el renderizado como:

Nos permite asignar y subir a la gráfica información básica sobre el modo que se realiza el renderizado

> - La primitiva con la que vamos a interpretar los VertexBuffers
> - Arraybuffers con información de los vértices:  los *Vertex Buffers*
>  - R<sup>3</sup> :: posición 
>  - R<sup>3</sup> :: vector normal
>  - R<sup>2</sup> :: coordenadas de textura
>  - R<sup>4</sup> :: color rgba
>- Flags para cambiar ciertos parámetros
>  - Depth Test (enabled / disabled): 
>  - Alpha Blending
>  - Clear Color

>- mapas de textura de tipo:
>  - texturas 2D (texturas normales, shadow maps, bump maps...)
>  - texturas 3D (cubemaps, environment maps)
>- MAS COSAS

---
##1.2 Primitive Processing

--
#N Texturas


















<!-- anexos -->
[^1:a]: Documentación OpenGL ES @ [**kronos.org**](https://www.khronos.org/registry/gles/specs/2.0/es_cm_spec_2.0.24.pdf)