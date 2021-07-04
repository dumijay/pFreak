import path from "path";

export default async function loadLibraries(config, page, candidate_name){
    let candidate_config = config.library_paths[candidate_name];

    if( !candidate_config ) return;

    await page.evaluate( 
        
        (library_file_path, sources) => {
            
            for( var i = 0; i < sources.length; i++ ){
                var script = document.createElement("script");
                script.src = library_file_path + "/" +  sources[i];

                document.body.appendChild(script);
            }
        },

        path.resolve(config.path_to_folder + "/libraries/"), candidate_config.sources
    );

    if( candidate_config.isLoadedFunction ){
        await page.waitForFunction( new Function(candidate_config.isLoadedFunction) );
    }
}