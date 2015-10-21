function getUriParams()
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    var params = {};
    var length = vars.length;
    for (var i=0;i<length;i++) {
        //params[pair[0]] = decodeURI(pair[1]);
        var pair = vars[i].split("=");
        params[pair[0]] =  decodeURI(pair[1]);
    }
    return params;
}