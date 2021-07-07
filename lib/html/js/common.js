function loadJSON(url, callback, onErrorCallback){
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");

    request.onerror = function(e){
        onErrorCallback(e);
    }

    request.onreadystatechange = function(e){
        if( e.target.readyState == 4 && e.target.status == "200" ){
            callback( JSON.parse( e.target.responseText ) );
        }

        if( e.target.readyState == 4 && parseInt(e.target.status) > 400 ){
            onErrorCallback(e);
        }
    }

    request.open( "get", url, true );
    request.send();
}

function average(arr){
    var sum = 0;
    var count = 0;

    for(var i = 0; i < arr.length; i++ ){
        
        if( !isNaN(arr[i]) ){
            sum += arr[i];
            count++;
        }
    }

    return sum / count;
}

function standardDeviation(mean, arr){
    var distances = [];
    
    for(var i = 0; i < arr.length; i++ ){
        
        if( !isNaN(arr[i]) ){
            distances.push(
                Math.pow(arr[i] - mean, 2)
            )
        }
    }

    var variance = average(distances);

    return Math.sqrt(variance);
}

function coefficientVariance(mean, sd){
    return Math.round(sd / mean * 100);
}

function processResult(value_array){

    if( typeof value_array[0] == "object" ){
        value_array = value_array.map( function(item){
            // console.log(item);
            return item.mean
        });
    }

    var mean = average( value_array );
    var sd = standardDeviation(mean, value_array);

    return {
        mean: mean,
        sd: sd,
        cv: coefficientVariance(mean, sd),
        __processed_type: true
    };
}