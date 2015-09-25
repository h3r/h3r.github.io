/**
 * Created by bleiz on 28/07/2015.
 */




var idcount = 0;
function Entity(id,mesh,tex,gl){
    this.id = idcount++;
    this.mesh = typeof mesh !== 'undefined' ? mesh  : null;
    this.albedo  = typeof tex  !== 'undefined' ? tex   : null;
    this.reflection = typeof tex  !== 'undefined' ? tex   : null;
    this.model = mat4.create();
    this.primitive = gl.TRIANGLES;
    this.flags = 0;

    if(this.albedo){
        if(this.albedo.texture_type == gl.TEXTURE_2D) this.flags |= smf.T_DIFFUSE_2D;
        if(this.albedo.texture_type == gl.TEXTURE_CUBE_MAP) this.flags |= smf.T_DIFFUSE_CM;
    }
}
Entity.prototype = {
    id:null,
    mesh:null,
    tex :null,
    model:null,
    primitive:null,
    getModel:function(){
        return this.model;
    }
}