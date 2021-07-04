export function getArgsConfig(){
    var config = {
        task: null,
        other: []
    };

    if( process.argv.length > 2 ){
        var current_flag = null;

        for( var i = 2, len = process.argv.length; i < len; i++ ){
            var arg = process.argv[i].trim();

            if( arg.substr(0, 2) == "--" ){
                current_flag =  arg.substr(2);

                if( !config[current_flag] ) config[current_flag] = [];
            }
            else{
                if( current_flag ){
                    config[current_flag].push( arg );
                    
                    current_flag = null;
                }
                else{
                    if( !config.action ) config.action = arg;
                    else config.other.push( arg );
                }
            }
        }
    }

    // console.log(config);

    return config;
}