attribute vec3 v_position;
attribute vec3 v_normal;
attribute vec2 v_coord;

void main(){
    gl_Position = vec4(v_position,1.0);
}