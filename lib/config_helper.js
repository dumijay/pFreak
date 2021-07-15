import fs from "fs";
import path from "path";
import { PACKAGE_NAME, logError, log, makeDir } from "./common.js";

export function getConfig(path_to_folder){

    const test_config_path = path.join( path_to_folder, "config.json");

    if( !fs.existsSync(test_config_path) ){
        logError(`\x1b[31m${test_config_path} doesn't exists. Aborting...`);
        log(`Run ${PACKAGE_NAME} init path/to/folder/ to create a config file.\n`);

        process.exit(1);
    }

    try{
        return JSON.parse( fs.readFileSync(test_config_path) )
    }
    catch(e){
        logError(`Couldn't parse \x1b[31m${test_config_path}. Aborting...`);
    }
    
}

export function initConfig( initial_config ){
    const path_to_folder = initial_config.path_to_folder ? "" + initial_config.path_to_folder : "./";
    delete initial_config.path_to_folder;

    if( path_to_folder != "./" ){
        makeDir( path_to_folder )
    }
    
    const test_config_path = path.join( path_to_folder, "config.json");

    const config = {
        headless: true,
        iteration_count: 10,
        assert_delay: 2000,
        cpu_slowdown: 4,
        library_paths: {
            "*": {
                sources: [],
                isLoadedFunction: " return true "
            }
        }
    }

    if( fs.existsSync(test_config_path) ){ //Overriding defaults by existing config
        const on_file_config = JSON.parse( fs.readFileSync(test_config_path) );

        Object.assign( config, on_file_config );
    }

    Object.assign( config, initial_config ); //Overriding with provided new configs through CLI

    makeDir(path_to_folder);

    fs.writeFileSync( test_config_path, JSON.stringify(config, null, 2) )

    makeDir( path.join(path_to_folder, "libraries") );

    makeDir( path.join(path_to_folder, "output") );

    makeDir( path.join(path_to_folder, "output/traces") );

    makeDir( path.join(path_to_folder, "tasks") );

    // makeDir( path.join(path_to_folder, "output/html") );

    makeSymLink(
        path.join( path.dirname(import.meta.url).substr(5), "./html/index.html" ),
        path.resolve( path.join( path_to_folder, "/output/index.html") )
    );

    makeSymLink(
        path.join( path.dirname(import.meta.url).substr(5), "./html/css/" ),
        path.resolve( path.join( path_to_folder, "/output/css/") )
    );

    makeSymLink(
        path.join( path.dirname(import.meta.url).substr(5), "./html/js/" ),
        path.resolve( path.join( path_to_folder, "/output/js/") )
    );

    makeSymLink(
        path.join( path.dirname(import.meta.url).substr(5), "../node_modules/timeline-viewer/docs/" ),
        path.resolve( path.join( path_to_folder, "/output/timeline-viewer/") )
    );

    var task_template_path = path.resolve( path.join( path_to_folder, "tasks", "_task_template.js") );

    if( !fs.existsSync(task_template_path) ){
        fs.copyFileSync(
            path.join( path.dirname(import.meta.url).substr(5), "./_task_template.js" ),
            task_template_path
        );
    }

    var empty_path_path = path.resolve( path.join( path_to_folder, "empty_page.html") );

    if( !fs.existsSync(empty_path_path) ){
        fs.copyFileSync(
            path.join( path.dirname(import.meta.url).substr(5), "./empty_page.html" ),
            empty_path_path
        );
    }

}

function makeSymLink(source, target){
    if( fs.existsSync(target) ){
        fs.unlinkSync(target);
    }

    fs.symlinkSync(
        source,
        target
    );
}