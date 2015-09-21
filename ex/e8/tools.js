/**
 * Created by bleiz on 28/07/2015.
 */
function getColorVec4(acolor){
    if(typeof acolor === 'string'){
        var a = JSON.parse('['+ color.substring(color.indexOf("(")+1,color.indexOf(")")) +']');
        acolor = vec4.fromValues(a[0],a[1],a[2],a[3]);
    }
    return acolor;
}
function quatRotation($quatIn,$axis,$rad){
    var q1 = quat.create();
    quat.setAxisAngle(q1,$axis,$rad);
    quat.multiply($quatIn, q1, $quatIn);
}

mat3.getRotationMatrix = function($out,$rx,$ry,$rz){
    var rQ = quat.create();
    var rM3 = mat3.create();

    if($rx != 0)
        quatRotation(rQ,vec3.fromValues(1.0,0.0,0.0),$rx);
    if($ry != 0)
        quatRotation(rQ,vec3.fromValues(0.0,1.0,0.0),$ry);
    if($rz != 0)
        quatRotation(rQ,vec3.fromValues(0.0,0.0,1.0),$rz);

    mat3.fromQuat(rM3,rQ);
    mat3.copy($out,rM3);
    return $out;
};
var angle = 90.0*DEG2RAD;
var rotMats = [
    mat3.getRotationMatrix(mat3.create(),0.0,angle,2*angle),  //+X der
    mat3.getRotationMatrix(mat3.create(),0.0,-angle,2*angle), //-X izq
    mat3.getRotationMatrix(mat3.create(),-angle,0.0,0.0),     //+Y top
    mat3.getRotationMatrix(mat3.create(),angle,0.0,0.0),      //-Y bottom
    mat3.getRotationMatrix(mat3.create(),0.0,2*angle,2*angle),//+Z back
    mat3.getRotationMatrix(mat3.create(),0.0,0.0,2*angle)     //-Z front
];

var updateCameraCubemap = function(entity){

    //tex = new GL.Texture(512,512, { texture_type: gl.TEXTURE_CUBE_MAP, magFilter: gl.LINEAR });
    tex.drawTo(function(tex,face)
    {
        for(var i in entities)
        {

            if (!entities[i].mesh || i == 'grid' || entities[i] == entity) {
                continue;
            }
            //gl.texture.cubemap_camera_parameters
            gl.clearColor(0.1, 0.3, 0.4, 1);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            var uniforms = {
                u_texture: (entities[i].tex) ? entities[i].tex.bind(1) : 0,
                u_model: entities[i].getModel(),
                u_mvp: entity.camera.getMVP(entities[i].getModel()),
                u_rotationMatrix: rotMats[face]
            };
            shader.uniforms(uniforms).draw(entities[i].mesh, entities[i].primitive);
            return;
        }
    });
    return tex;
};

