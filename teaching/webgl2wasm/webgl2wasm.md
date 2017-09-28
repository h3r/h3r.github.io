# **Webgl2 to Wasm**

Hermann P. 2017 - [cmake, vs2015, Visual Studio 2017, c++, c, glfw, glad, nuklear, wasm, webgl, webgl2, opengl es 3.0]



## Table of Contents

[TOC]

## Introduction



## Requirements

* [Windows]

  * Git

  * CMake

  * Visual Studio 2017

    * with C++ complement
    * with CMake complement
    * with "Windows 10 SDK" complement
    * better use English

  * Emscripten

    ​

* [Mac OS] <TODO>

* [Unix] <TODO>

## Instalation and Requirements

short list: [[git](https://git-scm.com/), [cmake](https://cmake.org/download/), [emscripten](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html), [Visual Studio 2017](https://www.visualstudio.com/es/thank-you-downloading-visual-studio/?sku=Community&rel=15)]

1.  ***GIT***: a version control software, we will use to include several submodules to our project to have lightweight project. 

   [DOWNLOAD](https://git-scm.com/) For Windows/MacOSX ***OR*** On Linux use:

   ```shell
   # Install git
   sudo apt-get install git-core
   ```

   ​

   Also, if you plan to use git from commandline and if you want to use in conjunction with Github and never did before, you may need to generate a new RSA key. IF not you may skip to the next point.

   I'll include the github tutorial:

   ------

   ​

    1.  Open Git Bash

    2.  Paste the text below, substituting in your GitHub email address. 

        ```shell
        ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
        ```

        This creates a new ssh key, using the provided email as a label

        ```shell
        Generating public/private rsa key pair.
        ```

    3.  When you're prompted to "Enter a file in which to save the key," press Enter. This accepts the default file location.

        ```shell
        Enter a file in which to save the key (/c/Users/you/.ssh/id_rsa):[Press enter]
        ```

    4.  At the prompt, type a secure passphrase. For more information, see ["Working with SSH key passphrases"](https://help.github.com/articles/working-with-ssh-key-passphrases).

    5.  Copy your ssh rsa key generated to the clipboard

        ```shell
         clip < ~/.ssh/id_rsa.pub
        ```

    6.  In the upper-right corner of any page, click your profile photo, then click **Settings**.![](https://help.github.com/assets/images/help/settings/userbar-account-settings.png)

    7.  In the user settings sidebar, click **SSH and GPG keys**.

         ![](https://help.github.com/assets/images/help/settings/settings-sidebar-ssh-keys.png) 

         ​

    8.  Click **New SSH key** or **Add SSH key** ![](https://help.github.com/assets/images/help/settings/ssh-add-ssh-key.png)

    9.  In the "Title" field, add a descriptive label for the new key. For example, if you're using a personal Mac, you might call this key "Personal MacBook Air".

    10.  Paste your key into the "Key" field.![](https://help.github.com/assets/images/help/settings/ssh-key-paste.png)

    11.  Click **Add SSH key**

           ![](https://help.github.com/assets/images/help/settings/ssh-add-key.png)

    12.  If prompted, confirm your GitHub password. 

           ![](https://help.github.com/assets/images/help/settings/sudo_mode_popup.png)

   ------

   ​

2. ***CMake***: Thisis awesome tool, simplifies the task of setting up the compilator parameters, its multiplatform, modular, generates automatically the solution if you want, and also its quite trending, almost any new library or project you find will have also its own CMakeLists.txt to build automatically. Select the version required for your OS an install, no further config needed.

   [DOWNLOAD](https://cmake.org/download/)

   ​

3.  ***Emscripten***: Hard part, for now im not sure 100% download the portable SDK for your platform and you may check its own instalation tutorial if ocurs changes in future.

   [DOWNLOAD](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)

   My personal choice is to create a emsdk folder in c: and put zip contents there.

   Also you have to **be in the folder** where you put the zip contents to use the following commands.

   ​

   On Linux / MacOS:

   ```shell
   # Fetch the latest registry of available tools.
   ./emsdk update

   # Download and install the latest SDK tools.
   ./emsdk install latest

   # Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
   ./emsdk activate latest

   # Activate PATH and other environment variables in the current terminal
   source ./emsdk_env.sh
   ```

   On Windows (open command line **with administrator rights**):

   ​

   ```shell
   # Fetch the latest registry of available tools.
   emsdk update

   # Download and install the latest SDK tools.
   emsdk install latest

   # Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
   emsdk activate latest

   # Activate PATH and other environment variables in the current terminal
   emsdk_env.bat
   ```

   ​

   **Platform-specific notes**

   **On MacOS X:**

   1. Install the *XCode Command Line Tools*. These are a precondition for *git*.

      - Install XCode from the [Mac OS X App Store](http://superuser.com/questions/455214/where-is-svn-on-os-x-mountain-lion).
      - In **XCode | Preferences | Downloads**, install *Command Line Tools*.

      ​

   2. Install *node.js* from <http://nodejs.org/

      ​

   **On Linux**:

   - The system must have a working [Compiler toolchain](https://kripken.github.io/emscripten-site/docs/building_from_source/toolchain_what_is_needed.html#compiler-toolchain) (because *emsdk* builds software from the source):

     ```shell
     #Update the package lists
     sudo apt-get update

     # Install *gcc* (and related dependencies)
     sudo apt-get install build-essential

     # Install cmake
     sudo apt-get install cmake
     ```

     ​

   - Python*, *node.js* or *Java* are not provided by *emsdk*. The user is expected to install these beforehand with the *system package manager*:

     ```shell
     # Install Python
     sudo apt-get install python2.7

     # Install node.js
     sudo apt-get install nodejs

     # Install Java (optional, only needed for Closure Compiler minification)
     sudo apt-get install default-jre
     ```

     ​


## Folder Structure

* < project_root >
  * < assets > //whatever we need on future like shaders, textures, meshes, etc...
  * < build > //the executable files generated are placed here
    * example.exe 
  * < libraries > //binary dependencies
    * glfw // allows to manage window/input calls
    * glm //3D math library
    * nuklear //gui library
  *  < source >
    * < include > //to place our .h files
    * main.cpp
  * CMakeLists.txt
  * CMakeSettings.json




## Our Project Example

src/**main.cpp**

This little demo includes glfw and nuklear sample for GUI

```c++
#include <iostream>


// THIS IS OPTIONAL AND NOT REQUIRED, ONLY USE THIS IF YOU DON'T WANT GLAD TO INCLUDE windows.h
// GLAD will include windows.h for APIENTRY if it was not previously defined.
// Make sure you have the correct definition for APIENTRY for platforms which define _WIN32 but don't use __stdcall
#ifdef _WIN32
#define APIENTRY __stdcall
#endif

// GLAD
#include <glad/glad.h>

// confirm that GLAD didn't include windows.h
#ifdef _WINDOWS_
#error windows.h was included!
#endif

// GLFW
#include <GLFW/glfw3.h>

#define NK_INCLUDE_FIXED_TYPES
#define NK_INCLUDE_STANDARD_IO
#define NK_INCLUDE_STANDARD_VARARGS
#define NK_INCLUDE_DEFAULT_ALLOCATOR
#define NK_INCLUDE_VERTEX_BUFFER_OUTPUT
#define NK_INCLUDE_FONT_BAKING
#define NK_INCLUDE_DEFAULT_FONT
#define NK_IMPLEMENTATION
#define NK_GLFW_GL3_IMPLEMENTATION
#include "nuklear.h"
#include "demo/glfw_opengl3/nuklear_glfw_gl3.h"

#define MAX_VERTEX_BUFFER 512 * 1024
#define MAX_ELEMENT_BUFFER 128 * 1024

// Function prototypes
void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode);

// Window dimensions
int width = 800, height = 600;


// The MAIN function, from here we start the application and run the game loop
int main()
{
	std::cout << "Starting GLFW context, OpenGL 3.3" << std::endl;
	// Init GLFW
	glfwInit();
	// Set all the required options for GLFW
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);

	// Create a GLFWwindow object that we can use for GLFW's functions
	GLFWwindow* window = glfwCreateWindow(width, height, "LearnOpenGL", NULL, NULL);
	glfwMakeContextCurrent(window);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate();
		return -1;
	}

	// Set the required callback functions
	glfwSetKeyCallback(window, key_callback);

	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize OpenGL context" << std::endl;
		return -1;
	}

	// Define the viewport dimensions
	glViewport(0, 0, width, height);


	//NUKLEAR load and config
	struct nk_context *ctx;
	struct nk_color background;
	ctx = nk_glfw3_init(window, NK_GLFW3_INSTALL_CALLBACKS);
	/* Load Fonts: if none of these are loaded a default font will be used  */
	/* Load Cursor: if you uncomment cursor loading please hide the cursor */
	{struct nk_font_atlas *atlas;
	nk_glfw3_font_stash_begin(&atlas);
	/*struct nk_font *droid = nk_font_atlas_add_from_file(atlas, "../../../extra_font/DroidSans.ttf", 14, 0);*/
	/*struct nk_font *roboto = nk_font_atlas_add_from_file(atlas, "../../../extra_font/Roboto-Regular.ttf", 14, 0);*/
	/*struct nk_font *future = nk_font_atlas_add_from_file(atlas, "../../../extra_font/kenvector_future_thin.ttf", 13, 0);*/
	/*struct nk_font *clean = nk_font_atlas_add_from_file(atlas, "../../../extra_font/ProggyClean.ttf", 12, 0);*/
	/*struct nk_font *tiny = nk_font_atlas_add_from_file(atlas, "../../../extra_font/ProggyTiny.ttf", 10, 0);*/
	/*struct nk_font *cousine = nk_font_atlas_add_from_file(atlas, "../../../extra_font/Cousine-Regular.ttf", 13, 0);*/
	nk_glfw3_font_stash_end();
	/*nk_style_load_all_cursors(ctx, atlas->cursors);*/
	/*nk_style_set_font(ctx, &droid->handle);*/}

	/* style.c */
	/*set_style(ctx, THEME_WHITE);*/
	/*set_style(ctx, THEME_RED);*/
	/*set_style(ctx, THEME_BLUE);*/
	/*set_style(ctx, THEME_DARK);*/

	background = nk_rgb(28, 48, 62);

	// Game loop
	while (!glfwWindowShouldClose(window))
	{
		// Check if any events have been activated (key pressed, mouse moved etc.) and call corresponding response functions
		glfwPollEvents();
		nk_glfw3_new_frame();

		/* GUI */
		if (nk_begin(ctx, "Demo", nk_rect(50, 50, 230, 250),
			NK_WINDOW_BORDER | NK_WINDOW_MOVABLE | NK_WINDOW_SCALABLE |
			NK_WINDOW_MINIMIZABLE | NK_WINDOW_TITLE))
		{
			enum { EASY, HARD };
			static int op = EASY;
			static int property = 20;
			nk_layout_row_static(ctx, 30, 80, 1);
			if (nk_button_label(ctx, "button"))
				fprintf(stdout, "button pressed\n");

			nk_layout_row_dynamic(ctx, 30, 2);
			if (nk_option_label(ctx, "easy", op == EASY)) op = EASY;
			if (nk_option_label(ctx, "hard", op == HARD)) op = HARD;

			nk_layout_row_dynamic(ctx, 25, 1);
			nk_property_int(ctx, "Compression:", 0, &property, 100, 10, 1);

			nk_layout_row_dynamic(ctx, 20, 1);
			nk_label(ctx, "background:", NK_TEXT_LEFT);
			nk_layout_row_dynamic(ctx, 25, 1);
			if (nk_combo_begin_color(ctx, background, nk_vec2(nk_widget_width(ctx), 400))) {
				nk_layout_row_dynamic(ctx, 120, 1);
				background = nk_color_picker(ctx, background, NK_RGBA);
				nk_layout_row_dynamic(ctx, 25, 1);
				background.r = (nk_byte)nk_propertyi(ctx, "#R:", 0, background.r, 255, 1, 1);
				background.g = (nk_byte)nk_propertyi(ctx, "#G:", 0, background.g, 255, 1, 1);
				background.b = (nk_byte)nk_propertyi(ctx, "#B:", 0, background.b, 255, 1, 1);
				background.a = (nk_byte)nk_propertyi(ctx, "#A:", 0, background.a, 255, 1, 1);
				nk_combo_end(ctx);
			}
		}
		nk_end(ctx);


		/* Draw */
		{float bg[4];
		nk_color_fv(bg, background);
		glfwGetWindowSize(window, &width, &height);
		glViewport(0, 0, width, height);
		glClear(GL_COLOR_BUFFER_BIT);
		glClearColor(bg[0], bg[1], bg[2], bg[3]);
		/* IMPORTANT: `nk_glfw_render` modifies some global OpenGL state
		* with blending, scissor, face culling, depth test and viewport and
		* defaults everything back into a default state.
		* Make sure to either a.) save and restore or b.) reset your own state after
		* rendering the UI. */
		nk_glfw3_render(NK_ANTI_ALIASING_ON, MAX_VERTEX_BUFFER, MAX_ELEMENT_BUFFER);
		glfwSwapBuffers(window); }
	}
	nk_glfw3_shutdown();
	glfwTerminate();

	// Terminates GLFW, clearing any resources allocated by GLFW.
	glfwTerminate();
	return 0;
}

// Is called whenever a key is pressed/released via GLFW
void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode)
{
	std::cout << key << std::endl;
	if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
		glfwSetWindowShouldClose(window, GL_TRUE);
}
```



/**CMakeLists.txt**

This file defines the configuration of the compiler

```cmake
cmake_minimum_required(VERSION 3.8)
#cmake_policy(SET CMP0015 NEW)
project(try237)
set(CMAKE_VERBOSE_MAKEFILE on)

#set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build.emscripten)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/builds)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/lib)


set(LIST_LIBRARY "")
set(LIST_LINK_FLAGS_DEBUG "")
set(LIST_LINK_FLAGS "")

#compile and add libraries
#glew
set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(_GLFW_WIN32 1)
set(_GLFW_X11 0)

add_subdirectory(external/glfw)
include_directories(external/glfw
					external/glfw/deps
					external/glfw/include)


#glad
set(GLAD "${GLFW_SOURCE_DIR}/deps/glad/glad.h"
         "${GLFW_SOURCE_DIR}/deps/glad.c"
)

#nuklear
include_directories(external/nuklear/)

#GLM
add_definitions(-DGLM_ENABLE_EXPERIMENTAL)
include_directories(external/glm/)

#include .h from project
include_directories(include/)

add_definitions("-s DEMANGLE_SUPPORT=1 --preload-file ${CMAKE_SOURCE_DIR}/assets --bind")

#if("${COMPILATION_TARGET}" STREQUAL "EMSCRIPTEN")
	set(CMAKE_C_COMPILER "emcc")
	add_definitions(-D__EMSCRIPTEN__)
	add_definitions(-DEMSCRIPTEN)
	add_definitions(-std=c++11)
	add_definitions(-fstack-protector)
	add_definitions(-g)
	add_definitions(-D__BROWSER__)
	add_definitions(-O0)
	add_definitions(-fno-exceptions)
	add_definitions(-Wall)

	#INCLUDE(cmake/emscriptenIncludes.cmake)
	#set(MAIN_FILE "src/emscripten_main.cpp")

	list(APPEND LIST_LINK_FLAGS_DEBUG  "--bind -s DEMANGLE_SUPPORT=1 -s EXPORTED_FUNCTIONS=\"['_main', '_update']\" -s NO_EXIT_RUNTIME=1 -s ASSERTIONS=1  -s TOTAL_MEMORY=335544320  -s  ALLOW_MEMORY_GROWTH=0  -s DEMANGLE_SUPPORT=1 -O0 --js-opts 1 -g1 -s SAFE_HEAP=0")
	list(APPEND LIST_LINK_FLAGS "--bind -s DEMANGLE_SUPPORT=1 -s EXPORTED_FUNCTIONS=\"['_main', '_update']\" -s NO_EXIT_RUNTIME=1 -s ASSERTIONS=1  -s  ALLOW_MEMORY_GROWTH=1 -s DEMANGLE_SUPPORT=1 -O0 --js-opts 1 -g1 -s SAFE_HEAP=0")

	include_directories($ENV{EMSCRIPTEN}/system/include)
	include_directories($ENV{EMSCRIPTEN}/system/local/include)
	include_directories($ENV{EMSCRIPTEN}/system/include/compat)
	include_directories($ENV{EMSCRIPTEN}/system/include/libcxx)
	include_directories($ENV{EMSCRIPTEN}/system/include)
	include_directories($ENV{EMSCRIPTEN}/system/include/emscripten)
	include_directories($ENV{EMSCRIPTEN}/system/include/bsd)
	include_directories($ENV{EMSCRIPTEN}/system/include/libc)
	include_directories($ENV{EMSCRIPTEN}/system/include/gfx)
	include_directories($ENV{EMSCRIPTEN}/system/include/net)
	include_directories($ENV{EMSCRIPTEN}/system/include/SDL)

	list(APPEND LIST_LINK_FLAGS_DEBUG "--preload-file \"${CMAKE_CURRENT_SOURCE_DIR}/shaders/gles20/@/shaders/\" --preload-file \"${CMAKE_CURRENT_SOURCE_DIR}/assets/preload/@assets/\"")
	list(APPEND LIST_LINK_FLAGS "--preload-file \"${CMAKE_CURRENT_SOURCE_DIR}/shaders/gles20/@/shaders/\" --preload-file \"${CMAKE_CURRENT_SOURCE_DIR}/assets/preload/@assets/\"")

#endif()

add_executable(try237
		src/main.cpp
		#headers.h
		#sources.cpp
		${GLAD}
)

target_link_libraries(try237 glfw ${GLFW_LIBRARIES})
#set_target_properties(try237 PROPERTIES LINK_FLAGS "-s DEMANGLE_SUPPORT=1 --preload-file assets --bind")
string(REPLACE ";" " " LIST_LINK_FLAGS_DEBUG "${LIST_LINK_FLAGS_DEBUG}")
string(REPLACE ";" " " LIST_LINK_FLAGS "${LIST_LINK_FLAGS}")

set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS_DEBUG "${LIST_LINK_FLAGS_DEBUG}")
set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS "${LIST_LINK_FLAGS}")

```



/**CMakeSettings.json**

This file lets define compiler parameters, target versions, etc

```json
{
    // Consulte https://go.microsoft.com//fwlink//?linkid=834763 para obtener más información sobre este archivo.
  "configurations": [
    {
      "name": "Debug - WIN",
      "generator": "Ninja",
      "configurationType": "Debug",
      "inheritEnvironments": [ "msvc_x64" ],
      "buildRoot": "${env.USERPROFILE}\\CMakeBuilds\\${workspaceHash}\\build\\${name}",
      "cmakeCommandArgs": "",
      "buildCommandArgs": "-v",
      "ctestCommandArgs": ""
    },
    {
      "name": "Release - WIN",
      "generator": "Ninja",
      "configurationType": "RelWithDebInfo",
      "inheritEnvironments": [ "msvc_x64" ],
      "buildRoot": "${env.USERPROFILE}\\CMakeBuilds\\${workspaceHash}\\build\\${name}",
      "cmakeCommandArgs": "",
      "buildCommandArgs": "-v",
      "ctestCommandArgs": ""
    },
    {
      "name": "EMS - GLES2 DEBUG",
      "generator": "Ninja",
      "configurationType": "RelWithDebInfo",
      "inheritEnvironments": [ "msvc_x64" ],
      "buildRoot": "${workspaceRoot}\\builds\\Release\\cmake\\${name}",
      "cmakeCommandArgs": "-DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=Debug -DCMAKE_TOOLCHAIN_FILE=C:/emsdk/emscripten/1.37.21/cmake/Modules/Platform/Emscripten.cmake -DAPI:STRING=OPENGLES -DCOMPILATION_TARGET:STRING=EMSCRIPTEN -DCONFIG=DEBUG",
      "buildCommandArgs": "-v",
      "ctestCommandArgs": ""
    }
  ]
}
```





## Conclusions

TOO MUCH CONFUSION



## Some Problems Found @ Past

When compiling with emscripten, glfw thinks that is using UNIX (but i was running win32) and tries to instantiate X11 that does not exist on windows.