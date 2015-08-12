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


