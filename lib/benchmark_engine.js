import fs from "fs"
import path, { resolve } from "path";

import loadLibraries from "./library_helper.js";
import {loadTask, getTasks} from "./task_helper.js";
import getDuration from "./duration_helper.js";
import { log, EMPTY_PAGE_PATH, getOutputFormat, getSystemInformation, getTraceFilePath, sleep, logError } from "./common.js";

var trace_file_path;
var task_failed_counts = {};

export default async function startBenchmark(config){

    var output = getOutputFormat();

    trace_file_path = getTraceFilePath(config);

    if( fs.existsSync(trace_file_path) ){
        output = JSON.parse( fs.readFileSync( trace_file_path ).toString() );
    }

    output.metadata.machine_details = getSystemInformation();

    var benchmark_results = output.result.benchmark;
    var test_results = output.result.tests;

    var output_task_configs = output.metadata.task_configs;

    var iterations_count = config.iteration_count || 10;

    var specific_tasks = config.specific_tasks || [];
    var specific_task_categories = config.specific_task_categories || [];
    var specific_candidates = config.specific_candidates || [];

    const task_path_configs = getTasks(config.path_to_folder);

    output.metadata.config = config;

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

        if( !benchmark_results[task_config.category] ) benchmark_results[task_config.category] = {};
        var this_category_benchmark_result = benchmark_results[task_config.category];

        if( !test_results[task_config.category] ) test_results[task_config.category] = {};
        var this_category_test_result = test_results[task_config.category];

        if( specific_tasks.length == 0 && specific_task_categories.length == 0 && specific_candidates.length == 0 ){
            if( isTaskCompleted(this_category_benchmark_result[task_config.short_name], iterations_count, task_config.candidates.length) ){
                log( `Task ${task_config.short_name} already present in results.json. Ignoring it.` );

                continue
            }
        }

        this_category_benchmark_result[task_config.short_name] = {};
        var this_task_benchmark_result = this_category_benchmark_result[task_config.short_name];

        this_category_test_result[task_config.short_name] = {};
        var this_task_test_result = this_category_test_result[task_config.short_name];

        for( var iteration_i = 0; iteration_i < iterations_count; iteration_i++ ){

            for( var candidate_i = 0; candidate_i < task_config.candidates.length; candidate_i++ ){
                var candidate = task_config.candidates[candidate_i];

                if( specific_candidates.length != 0 ){
                    if( specific_candidates.indexOf(candidate) == -1 ) continue;
                }

                if( !this_task_benchmark_result[candidate] ) this_task_benchmark_result[candidate] = [];
                var this_candidate_benchmark_result = this_task_benchmark_result[candidate];

                if( !this_task_test_result[candidate] ) this_task_test_result[candidate] = {
                    status: true
                };
                var this_candidate_test_result = this_task_test_result[candidate];

                task_config.browser_task_config.candidate = candidate;

                process.stdout.write( `${task_config.category} ${task_config.short_name} ${candidate} ${iteration_i}` );

                var task_duration = await handleRunTask( config, task_config, candidate, task_path_config, iteration_i )
                    .catch( error => {
                        console.trace(error);

                        this_candidate_test_result.status = false;
                        this_candidate_test_result.error = error.toString();
                    });

                // Build results.json from previously saved traces instead
                // console.log(candidate, task_name, iteration_i);
                // var task_duration = await getDuration( fs.readFileSync(`./output/traces/${candidate}_${task_name}_${iteration_i}.json`) )

                this_candidate_benchmark_result.push( task_duration );

                if( this_candidate_test_result.status ){
                    process.stdout.write( "\x1b[32m : Passed\n\x1b[0m" );
                    passed_count++;
                }
                else{
                    process.stdout.write( "\x1b[31m : Failed\n\x1b[0m" );
                }

                total_tested_count++;
            }
        }

        writeOutput(output);
    }

    let complete_message = "\nBenchmark is complete: "
    
    var failed = total_tested_count != passed_count;

    if( total_tested_count != passed_count ){
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

function isTaskCompleted(task_results, iteration_count, candidate_count){
    var candidate_count_present = 0;

    for( var candidate in task_results ){

        if( task_results[candidate].length < iteration_count ) return false;
        candidate_count_present++;
    }

    if( candidate_count != candidate_count_present ) return false;

    return true;
}

function handleRunTask(config, task_config, candidate, task_path_config, iteration_i){
    return new Promise( async (resolve, reject) => {
        var result;

        let task_id = `${task_config.category}_${task_config.short_name}`;

        result = await runTask( config, task_config, candidate, task_path_config, iteration_i )
            .catch( async (e) => {

                if( !task_failed_counts[task_id] ) task_failed_counts[task_id] = 0;
                task_failed_counts[task_id]++;

                if( task_failed_counts[task_id] < 5 ){
                    process.stdout.write( "\x1b[31m : Failed attempt: " + task_failed_counts[task_id] + ", trying again. \x1b[0m" );
                    sleep(2000);

                    result = await handleRunTask( config, task_config, candidate, task_path_config, iteration_i )
                        .catch(reject)
                }
                else{
                    reject(e);
                }
            });
        
        task_failed_counts[task_id] = 0;
        resolve(result);
    });
}

async function runTask( config, task_config, candidate, task_path_config, iteration_i ){
    
    let raw_trace_file_path, page;

    try{
        page = await global.browser.newPage();

        var set_cpu_slowdown = task_config.cpu_slowdown || config.cpu_slowdown || 4 ;

        if( set_cpu_slowdown != 1 ){
            const client = await page.target().createCDPSession();
            await client.send('Emulation.setCPUThrottlingRate', { rate: set_cpu_slowdown });
        }

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

        await loadLibraries( config, page, candidate );
        await loadLibraries( config, page, "*" );
        
        await loadTask( config, page, task_path_config );

        await page.evaluate(
            (browser_task_config, task_name) => {
                currentTask = _pfreak.tasks[ _pfreak.getTaskIndexByName(task_name) ];

                window.browser_task_config = browser_task_config;

                if( currentTask.candidateSetup ){
                    var tmp_config = currentTask.candidateSetup( window.browser_task_config );
                    if( tmp_config ) window.browser_task_config = tmp_config;
                }

                window.runCandidate = function(){
                    window.candidate_results = currentTask.candidates[window.browser_task_config.candidate]( window.browser_task_config );
                }

                setTimeout( runCandidate, 1000 );
            },
            task_config.browser_task_config, 
            task_config.short_name
        );

        raw_trace_file_path = path.join( config.path_to_folder, `output/traces/${task_config.category}_${task_config.short_name}_${candidate}_${iteration_i}.json` );

        if( fs.existsSync(raw_trace_file_path) ){
            fs.unlinkSync(raw_trace_file_path);
        }

        // await sleep( 500 );
        
        await page.tracing.start({
            path: raw_trace_file_path
        });

        let sleep_time = task_config.assert_delay || config.assert_delay || 1000;
        sleep_time += 1000; //For the runCandidate setTimeout with a margin

        // sleep_time = sleep_time / 4 * set_cpu_slowdown;
        
        await sleep( sleep_time );

        let duration = getDuration( await page.tracing.stop() ) //Returns a <Promise<Buffer>>

        await page.evaluate( 
            () => currentTask.assert( window.browser_task_config, window.candidate_results ) 
        );

        return duration;

    }
    catch(e){

        if( fs.existsSync(raw_trace_file_path) ){
            fs.unlinkSync(raw_trace_file_path);
        }

        throw(e);
    }
    finally{
        // await page.tracing.stop();
        await page.close();
    }
}