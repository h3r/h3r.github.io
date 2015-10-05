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
var cubemapCam = new Camera();



var updateCameraCubemap = function(entity){

    var eye = entity.getPosition();
    tex.drawTo(function(texture,face)
    {

        var uniforms = {
            u_ref_i:        i_refl || 0.5,
            u_gamma:        1.0/gamma || 2.2,
            u_color:        vec4.multiply(vec4.create(),getColorVec4(color),vec4.fromValues(r,r,r)),
            u_light:        vec3.normalize(vec3.create(),vec4.fromValues(light.x,light.y, light.z))
        };
        var ent = null;

        var dir = Texture.cubemap_camera_parameters[face].dir;
        var center = vec3.add(vec3.create(),dir,eye);
        var up =  Texture.cubemap_camera_parameters[face].up;
        cubemapCam.lookAt(eye, center, up);//eye center up
        cubemapCam.perspective(90 * DEG2RAD, 1.0 , 0.1, 1000);

        gl.clearColor(1.0,1.0,0.0,0.1);
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        var ent = null;
        for( var i in entities ){
            ent = entities[i];

            if(!ent || !ent.mesh || (i == 'grid' && !grid) || ent == entity) continue;

                ent.checkAlbedoTextureFlag();
                ent.checkReflectionTextureFlag();
            if(ent.flags & smf.T_SPECULAR){
                uniforms.u_eye          = cubemapCam.getEye();
                uniforms.u_reflection   = (ent.reflection) ? ent.reflection.bind(2) : 0;
            }
            if( ent.flags & smf.SKY){
                uniforms.u_eye          = mat4.getTranslation(vec3.create(), mat4.invert(cubemapCam.temp,cubemapCam.view));
            }else
            if(ent.flags & smf.T_DIFFUSE) {
                uniforms.u_albedo       = (ent.albedo) ? ent.albedo.bind(1) : 0;
            }
            uniforms.u_model            = ent.getModel();
            uniforms.u_mvp              = cubemapCam.getMVP(ent.getModel());
            ShaderManager.load(ent.flags).uniforms(uniforms).draw(ent.mesh, ent.primitive);

        }
        return;

    });
    entity.checkReflectionTextureFlag();
    return tex;
};

