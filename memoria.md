
[return](/)

> **Nota:** No, no me he matado a hacer una web, es markdown plano auto-publicado, hecho con [**stackedit.io**](https://stackedit.io)

#**TFG**: Physically based rendering over web technologies#
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
No vamos a meternos de pleno, OpenGL es una librería que hace de puente entre nuestro código y la tarjeta gráfica. Nos permite pasar información en forma de arraybuffers que contienen los datos básicos para el renderizado.
A partir de la versión OpenGL 2.0, se cambia la logica del fixed pipeline y se permite introducir "hacks" para modificar el funcionamiento de diferentes fases del pipeline. Pero ya entraremos más adelante con los shaders.
La API nos permite pasar al toda una serie de datos como entrada para la siguiente fase, datos como:

>- flags para cambiar ciertos parámetros
>  - Depth Test (enabled / disabled): 
>- arraybuffer con información de los vértices:  el Vertex Buffer
>  - R<sup>3</sup> :: posición 
>  - R<sup>3</sup> :: vector normal
>  - R<sup>2</sup> :: coordenadas de textura
>  - R<sup>4</sup> :: color rgba
>- mapas de textura de tipo:
>  - texturas 2D (texturas normales, shadow maps, bump maps...)
>  - texturas 3D (cubemaps, environment maps)
>- MAS COSAS

---
##1.2 Primitive Processing


















<!-- anexos -->
[^1:a]: Documentación OpenGL ES @ [**kronos.org**](https://www.khronos.org/registry/gles/specs/2.0/es_cm_spec_2.0.24.pdf)