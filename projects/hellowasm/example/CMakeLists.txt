cmake_minimum_required(VERSION 3.8)
project(example CXX)
set (CMAKE_CXX_STANDARD 14)
add_definitions("-Wall" "-g" "-std=c++14")

#Input files
include_directories(${PROJECT_SOURCE_DIR}/source/include)
file(GLOB SRC_FILES ${PROJECT_SOURCE_DIR}/source/**/*.cpp)

#Output directory for binaries
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/libraries)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/libraries)

#Libraries
    #GLFW
    #GLM
    #Nuklear
    #Emscripten
	if (DEFINED EMSCRIPTEN)
		if (CMAKE_BUILD_TYPE MATCHES Debug)
			add_definitions(-g4) # Generates emscripten C++ sourcemaps
		endif()
	endif()

    set(CMAKE_C_COMPILER "emcc")   
        #//add_definitions("-DEMANGLE_SUPPORT=1 --preload-file ${CMAKE_SOURCE_DIR}/assets --bind")
    
add_executable(example
    source/example.cpp
    ${SRC_FILES}
    ${HDR_FILES}
    ${GLAD}
)
if (DEFINED EMSCRIPTEN)
set_target_properties(example 
    PROPERTIES SUFFIX ".html"
    LINK_FLAGS " --bind -s  NO_EXIT_RUNTIME=1 -g4")
em_link_js_library(example ${libraryJsFiles})
# add -O2 to minify
endif()