/**
 * Created by bleiz on 28/07/2015.
 */




var idcount = 0;
function Entity(id,mesh,tex,gl){
    this.id = idcount++;
    this.mesh = typeof mesh !== 'undefined' ? mesh  : null;
    this.tex  = typeof tex  !== 'undefined' ? tex   : null;
    this.model = mat4.create();
    this.primitive = gl.TRIANGLES;
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