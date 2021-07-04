#!/usr/bin/env node

import path from "path";
import { exec } from "child_process";
import fs from "fs";

import puppeteer from "puppeteer";

import {getConfig, initConfig} from "./lib/config_helper.js";
import startBenchmark from "./lib/benchmark_engine.js";
import { getArgsConfig } from "./lib/args_helper.js";
import { log, logError, PACKAGE_NAME } from "./lib/common.js";
import startTests from "./lib/tests_engine.js";
import { createNewTask } from "./lib/task_helper.js";


export async function main(){

    const initial_config = {};
    const args_config = getArgsConfig();

    if( args_config["iterations"] ){
        initial_config.iteration_count = parseInt( args_config["iterations"][0])
    }
    
    if( args_config["task"] ){
        initial_config.specific_tasks = args_config["task"];
    }

    if( args_config["category"] ){
        initial_config.specific_task_categories = args_config["category"];
    }

    if( args_config["candidate"] ){
        initial_config.specific_candidates = args_config["candidate"];
    }

    if( args_config["other"].length != 0 ){
        initial_config.path_to_folder = args_config["other"][0];
    }
    else{
        initial_config.path_to_folder = "./";
    }

    switch (args_config.action) {

        case "init":
            await initConfig(initial_config);
            break;

        case "benchmark":
            await handleStartBenchmark(initial_config);
            break;

        case "test":
            await handleStartTests(initial_config);
            break;

        case "reset":
            await resetResults(initial_config);
            break;

        case "show":
            await startWebServer(initial_config);
            break;

        case "new-task":
            await handleNewTask(initial_config);
            break;

        case "help":
            await showHelp();
            break;
        
        default:
            await showHelp();
    }
}

async function resetResults(initial_config){
    const trace_folder = `${initial_config.path_to_folder}/output/traces/`;

    if( !fs.existsSync( trace_folder ) ){
        logError(`It seems this is not initialized yet. Please run ${PACKAGE_NAME} init`);

        return;
    }

    const results_file = `${initial_config.path_to_folder}/output/results.json`;

    if( fs.existsSync( results_file ) ){
        fs.unlinkSync( results_file );
    }

    const trace_files = fs.readdirSync( trace_folder );

    trace_files.forEach( file => {
        fs.unlinkSync( path.join(trace_folder, file) );
    });
}

async function startWebServer(initial_config){
    if( !fs.existsSync( `${initial_config.path_to_folder}/output/index.html`) ){
        logError(`It seems this is not initialized yet. Please run ${PACKAGE_NAME} init`);

        return;
    }

    const child = exec(`npx http-server ${path.resolve(initial_config.path_to_folder)}/output/ -s -o -c-1`);
    
    child.stdout.pipe(process.stdout);

    child.on('exit', function() {
        process.exit();
    })

}

async function handleNewTask(initial_config){
    if( !fs.existsSync( `${initial_config.path_to_folder}/tasks/`) ){
        logError(`It seems this is not initialized yet. Please run ${PACKAGE_NAME} init`);

        return;
    }

    createNewTask( initial_config );

}

function showHelp(){
    log(`${PACKAGE_NAME} is a browser based unit-level JavaScript benchmarking and testing framework. \n` );

    log(`${PACKAGE_NAME} init path/to/folder/ \t\t Create a new config.json. Default to current folder.\n`);
    
    log(`${PACKAGE_NAME} new-task path/to/folder/ \t Create a new task. Provide the task name using --task. --category and --candidate are optional.`);
    log(`\t\t\t\t\t Eg: ${PACKAGE_NAME} new-task --candidate candidate_name --category category_name --task task_name\n`);

    log(`${PACKAGE_NAME} benchmark path/to/folder/ \t Start benchmarking and testing process.`);
    log(`${PACKAGE_NAME} test path/to/folder/ \t\t Start only the testing process.`);
    log(`${PACKAGE_NAME} reset path/to/folder/ \t\t Delete results.json and all trace files.\n`);
    
    log(`${PACKAGE_NAME} show path/to/folder/ \t\t Start http-server to view results on browser.\n`);

    log(`--iterations n \t\t\t\t Set iteration count. Default is 10.`)
    log(`--task task_name \t\t\t Run only specific task. Provide multiple --task flags to specify multiple tasks. Default is all.`)
    log(`--category category_name \t\t Run only specific task category. Provide multiple --category flags to specify multiple task categories. Default is all.`)
    log(`--candidate category_name \t\t Run only specific candidate. Provide multiple --candidate flags to specify multiple candidates. Default is all.`)
}

export async function handleStartBenchmark(initial_config){
    
    const config = getConfig( initial_config.path_to_folder );

    Object.assign(config, initial_config);

    global.browser = await puppeteer.launch({
        headless: config.headless == undefined ? true : config.headless
    });

    await startBenchmark(config)
        .catch( e => console.trace(e) );

    await browser.close();
}

export async function handleStartTests(initial_config){
    
    const config = getConfig( initial_config.path_to_folder );

    Object.assign(config, initial_config);

    global.browser = await puppeteer.launch({
        headless: config.headless == undefined ? true : config.headless
    });

    await startTests(config)
        .catch( e => console.trace(e) );;

    await browser.close();
}