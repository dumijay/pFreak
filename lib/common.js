import path from "path";
import os from "os";
import fs from "fs";

export const PACKAGE_NAME = "pfreak";
export const VERSION = "0.3";
export const EMPTY_PAGE_PATH = path.join( path.dirname(import.meta.url), "/../empty_page.html");

export function logError(msg){
    arguments[0] = "\x1b[31m$" + arguments[0];

    console.log.apply(this, arguments);
}

export function logWarning(msg){
    arguments[0] = "\x1b[35m$" + arguments[0];

    console.log.apply(this, arguments);
}

export function log(msg){
    arguments[0] = "\x1b[0m" + arguments[0];
    console.log.apply(this, arguments);
}

export function getOutputFormat(){
    return {
        result: {
            benchmark: {},
            tests: {}
        },

        metadata: {

            machine_details:{},
            task_configs: {},
            pfreak_version: VERSION
        }
    };
}

export function getTraceFilePath(config){
    return path.join( config.path_to_folder, "./output/results.json" );
}

export function getSystemInformation(){
    return {
        cpus: os.cpus(),
        totalmem: os.totalmem() / 1_073_741_824,
        freemem: Math.round((os.freemem() / 1_073_741_824) * 10) / 10,
        platform: os.platform(),
        release: os.release()
    }
}

export function sleep(duration){
    return new Promise(
        (resolve) => setTimeout(resolve, duration)
    );
}


export function makeDir(path){
    if( !fs.existsSync( path ) ){
        fs.mkdirSync( path );
    }
}