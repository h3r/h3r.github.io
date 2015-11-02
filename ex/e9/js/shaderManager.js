var _f = {
    //Configuration Flags
    T_DIFFUSE_2D : 1, // 0000 0001  //
    T_DIFFUSE_CM : 2, // 0000 0010  //
    T_DIFFUSE    : 3, // 0000 0011   //
    T_SPECULAR_2D: 4, // 0000 0100  //
    T_SPECULAR_CM: 8, // 0000 1000  //
    T_SPECULAR   : 12, // 0000 1000  //
    SKY          : 16
}

function updateFlags(n){
    if(!n.mustUpdateFlags)
        return;

    console.log('updateflags');
    if(n.flags == 'undefined' || n.flags == null)
        n.flags = 0;

    var aux = null;
    if(n.texture){
        aux = gl.textures[ n.texture ];
        if(aux && aux.texture_type == gl.TEXTURE_2D){
             flagOn(n.flags,_f.T_DIFFUSE_2D);
            flagOff(n.flags,_f.T_DIFFUSE_CM);
        }
        else if(aux && this.albedo.texture_type == gl.TEXTURE_CUBE_MAP){
             flagOn(n.flags,_f.T_DIFFUSE_CM);
            flagOff(n.flags,_f.T_DIFFUSE_2D);
        }
    }

    if(n.reflection){
        aux = gl.textures[ n.reflection ];
        if(aux && aux.texture_type == gl.TEXTURE_2D){
             flagOn(n.flags,_f.T_SPECULAR_2D);
            flagOff(n.flags,_f.T_SPECULAR_CM);

        }
        else if(aux && this.reflection.texture_type == gl.TEXTURE_CUBE_MAP){
             flagOn(n.flags,_f.T_SPECULAR_CM);
            flagOff(n.flags,_f.T_SPECULAR_2D);
        }
    }

    n.mustUpdateFlags = false;
}
