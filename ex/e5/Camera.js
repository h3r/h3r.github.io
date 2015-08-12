/**
 * Created by bleiz on 28/07/2015.
 */
var up = vec3.fromValues(0,1,0);
function Camera(){
    this.proj   = mat4.create();
    this.view   = mat4.create();
    this.mvp    = mat4.create();
    this.temp   = mat4.create();
    this.model  = mat4.create();
}
Camera.prototype = {
    proj    :null,
    view    :null,
    mvp     :null,
    temp    :null,
    model   :null,
    updated :true,
    perspective: function(fov, aspect, near, far){
        mat4.perspective(this.proj, fov, aspect, near, far);
    },
    lookAt: function(eye, center, up){
        mat4.lookAt(this.view, eye, center, up);
    },
    getMVP : function (model){
        mat4.multiply(this.temp,this.view,model);
        mat4.multiply(this.mvp,this.proj,this.temp);
        return this.mvp;
    },
    pan:function(v3){
        mat4.invert(this.temp,this.view);
        var right = this.temp.subarray(0,3);

        mat4.translate(this.view,this.view,vec3.fromValues(right[0] * -v3[0], 0, right[2] * -v3[0]));
        mat4.translate(this.view,this.view,vec3.fromValues(0,v3[1],0));
    },
    orbit:function(v3){
        mat4.invert(this.temp,this.view);
        var right = this.temp.subarray(0,3);

        mat4.rotate(this.view,this.view,v3[1],right);//ok
        mat4.rotateY(this.view,this.view, v3[0]);
    },
    zoom:function(d){
        mat4.invert(this.temp,this.view);
        var front = this.temp.subarray(8,11);

        mat4.translate(this.view,this.view,vec3.fromValues(front[0] * d,front[1] * d,front[2] * d));
    },
    update:function(dt){
        if(this.updated) return;
    }
}