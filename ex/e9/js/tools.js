function getUriParams()
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    var params = {};
    var length = vars.length;
    for (var i=0;i<length;i++) {
        var pair = vars[i].split("=");
        params[pair[0]] =  decodeURI(pair[1]);
    }
    return params;
}

function sort(object){
    if (typeof object != "object" || object instanceof Array) // Not to sort the array
        return object;
    var keys = Object.keys(object);
    keys.sort();
    var newObject = {};
    for (var i = 0; i < keys.length; i++){
        newObject[keys[i]] = sort(object[keys[i]])
    }
    return newObject;
}

function object2md5(config){
    if(typeof a != 'object' || keys(a).length == 0)
        return '';
    var sortedConfig = sort(config);
    config = JSON.stringify(sortedConfig);
    if(typeof config != 'string')
        throw 'object2md5 : something went wrong';
    return md5(config);
}

function flagOn     (flags, flag){ return flags |= flag ; }
function flagOff    (flags, flag){ return flags &= ~flag; }
function flagSwitch (flags, flag){ return flags ^= flag ; }
function getFlag    (flags, flag){ return (flags & flag)>0}

