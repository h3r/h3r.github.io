
-----------------------------------------------------------

[TOC]

-----------------------------------------------------------

#1 **Funcionamiento del Fixed Pipeline**
![](http://malideveloper.arm.com/downloads/deved/tutorial/SDK/android/2.0/pipeline.png)

##1.1 la API: *OpenGL*
No vamos a meternos de pleno, OpenGL es una librería que hace de puente entre nuestro código y la tarjeta gráfica. Nos permite pasar información en forma de Arrays que contienen los datos básicos para el renderizado. A partir de la versión OpenGL 2.0, se cambia la logica del fixed pipeline y se permite introducir "hacks" para modificar el funcionamiento de diferentes fases del pipeline: shaders. Pero ya entraremos más adelante con los shaders.

---
##1.2 Primitive Processing
