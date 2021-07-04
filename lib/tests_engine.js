import fs from "fs"

import loadLibraries from "./library_helper.js";
import {loadTask, getTasks} from "./task_helper.js";
import { log, EMPTY_PAGE_PATH, getOutputFormat, getTraceFilePath, sleep } from "./common.js";
import { fail } from "assert";

var trace_file_path;
const loaded_candidates = [];
const loaded_tasks = [];

export default async function startTests(config){

    var output = getOutputFormat();

    trace_file_path = getTraceFilePath(config);

    if( fs.existsSync(trace_file_path) ){
        output = JSON.parse( fs.readFileSync( trace_file_path ).toString() );
    }

    var test_results = output.result.tests;

    var output_task_configs = output.metadata.task_configs;

    var specific_tasks = config.specific_tasks || [];
    var specific_task_categories = config.specific_task_categories || [];
    var specific_candidates = config.specific_candidates || [];

    const task_path_configs = getTasks(config.path_to_folder);

    output.metadata.config = config;
    
    const page = await global.browser.newPage();

    await page.setViewport({
        width: 1920,
        height: 1280,
    });

    await page.goto(
        EMPTY_PAGE_PATH,
        {
            waitUntil: "networkidle2"
        }
    );

    await loadLibraries( config, page, "*" );

    let total_tested_count = 0;
    let passed_count = 0;

    for( var task_i in task_path_configs ){
        const task_path_config = task_path_configs[task_i];
        const task_config = task_path_config.task_config;
        
        if( specific_tasks.length != 0 && specific_tasks.indexOf(task_config.short_name) == -1 ){
            continue;
        }


        if( specific_task_categories.length != 0 ){
            if( specific_task_categories.indexOf(task_config.category) == -1 ) continue;
        }

        output_task_configs[`${task_config.category}_${task_config.short_name}`] = task_config;

        if( !test_results[task_config.category] ) test_results[task_config.category] = {};
        var this_category_test_result = test_results[task_config.category];

        this_category_test_result[task_config.short_name] = {};
        var this_task_test_result = this_category_test_result[task_config.short_name];

        for( var candidate_i = 0; candidate_i < task_config.candidates.length; candidate_i++ ){
            var candidate = task_config.candidates[candidate_i];

            if( specific_candidates.length != 0 ){
                if( specific_candidates.indexOf(candidate) == -1 ) continue;
            }

            if( !this_task_test_result[candidate] ) this_task_test_result[candidate] = {
                status: true
            };
            var this_candidate_test_result = this_task_test_result[candidate];

            task_config.browser_task_config.candidate = candidate;

            process.stdin.write( `${task_config.category} ${task_config.short_name} ${candidate}` );

            await runTest( page, config, task_config, candidate, task_path_config )
                .catch( error => {
                    // console.trace(error);

                    this_candidate_test_result.status = false;
                    this_candidate_test_result.error = error.toString();
                });
            
            if( this_candidate_test_result.status ){
                process.stdout.write( "\x1b[32m : Passed\n\x1b[0m" );
                passed_count++;
            }
            else{
                process.stdout.write( "\x1b[31m : Failed\x1b[0m | \x1b[35m" + this_candidate_test_result.error + "\x1b[0m\n" );
            }

            total_tested_count++;
        }

        writeOutput(output);
    }

    await page.close();

    let complete_message = "\nTest is complete: "
    var failed = total_tested_count != passed_count;

    if( failed ){
        complete_message += `\x1b[31m${passed_count}/${total_tested_count}\x1b[0m`
    }
    else{
        complete_message += `\x1b[32m${passed_count}/${total_tested_count}\x1b[0m`
    }

    process.stdout.write( complete_message + ".\n" );
    
    if( failed ) process.exit(1);
}

function writeOutput(output){
    fs.writeFileSync( trace_file_path, JSON.stringify( output, null, 2 ) );
}

async function runTest( page, config, task_config, candidate, task_path_config ){

    if( loaded_candidates.indexOf(candidate) == -1 ){
        await loadLibraries( config, page, candidate );

        loaded_candidates.push( candidate );
    }
    
    if( loaded_tasks.indexOf(task_path_config.task_id) == -1 ){
        await loadTask( config, page, task_path_config );

        loaded_tasks.push( task_path_config.task_id );
    }

    await page.evaluate(
        (browser_task_config, task_name) => {
            currentTask = _pfreak.tasks[ _pfreak.getTaskIndexByName(task_name) ];

            window.browser_task_config = browser_task_config;

            if( currentTask.candidateSetup ){
                var tmp_config = currentTask.candidateSetup( window.browser_task_config );
                if( tmp_config ) window.browser_task_config = tmp_config;
            }

            window.candidate_results = currentTask.candidates[browser_task_config.candidate]( browser_task_config );
        },
        task_config.browser_task_config, 
        task_config.short_name
    );

    await sleep( task_config.assert_delay || 0 );

    await page.evaluate( 
        () => currentTask.assert( window.browser_task_config, window.candidate_results ) 
    );

    await page.evaluate( 
        () => {
            currentTask.reset();

            window.candidate_results = null;
            window.browser_task_config = null;
            currentTask = null;
        }
    );
}