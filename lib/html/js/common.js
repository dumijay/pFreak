function loadJSON(url, callback){
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");

    request.onreadystatechange = function(e){
        if( e.target.readyState == 4 && e.target.status == "200" ){
            callback( JSON.parse( e.target.responseText ) );
        }
    }

    request.open( "get", url, true );
    request.send();
}