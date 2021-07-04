import fs from "fs";
import path from "path";
import vm from "vm";

import { log, EMPTY_PAGE_PATH, logError, makeDir } from "./common.js";

export function getTasks(path_to_folder){
    return getDirectoryTaskList( path.join(path_to_folder, "tasks/") );
}

function getDirectoryTaskList(tasks_path, sub_folder, dont_get_task_config){
    sub_folder = sub_folder || "";

    let task_list = [];

    const files = fs.readdirSync( tasks_path );

    files.forEach( file => {
        const file_path = path.join(tasks_path, file);

        if( fs.lstatSync(file_path).isDirectory() ){
            task_list = task_list.concat( getDirectoryTaskList(file_path, file) );
        }
        else{
            if( file[0] != "_" && file.substr(-3) == ".js" ){

                let file_name = file.substring(0, file.length - 3);
                
                const new_task_path = {
                    path: file_path,
                    sub_folder: sub_folder
                };

                if( !dont_get_task_config ){
                    new_task_path.task_config = getTaskConfig(new_task_path);
                }

                // if( !new_task_path.task_config.short_name ){
                //     new_task_path.task_config.short_name = file_name;
                // }

                new_task_path.task_id = `${sub_folder}_${new_task_path.task_config.short_name}`

                task_list.push( new_task_path );
            }
        }
    });

    return task_list.sort( (a, b) => a.task_config.display_order - b.task_config.display_order );
}

function getTaskConfig(task_path_config){
    const context = {
        _pfreak: {
            tasks: []
        },
        currentTask: null,
        browser_task_config: {}
    }

    vm.createContext( context );

    const task_code = fs.readFileSync(task_path_config.path).toString();

    try{
        vm.runInContext(task_code, context);
    }
    catch(error){
        logError( `Can't parse ${task_path_config.path}, probably a javascript syntax error. Aborting...`);
        console.trace(error);

        process.exit(1);
    }

    vm.runInContext( `currentTask = _pfreak.tasks[0];`, context);
    vm.runInContext( `browser_task_config = currentTask.setTaskData({})`, context);

    const currentTask = context._pfreak.tasks[0];

    var candidates = [];

    for( var candidate in currentTask.candidates ){
        candidates.push( candidate );
    }

    let category = currentTask.category || task_path_config.sub_folder;
    if( category.trim().length == 0 ) category = "Uncategorized"

    return{
        short_name: currentTask.short_name,
        display_order: currentTask.display_order,
        category: category,
        description: currentTask.description,
        candidates: candidates,
        cpu_slowdown: currentTask.cpu_slowdown,
        assert_delay: currentTask.assert_delay,
        browser_task_config: context.browser_task_config || {}
    }
}

async function getTaskConfigBrowser(config, task_path_config){

    throw("This is outdated. Refer getTaskConfig for the latest config");

    const page = await global.browser.newPage();
    
    await page.goto(
        EMPTY_PAGE_PATH
    );

    await loadTask( config, page, task_path_config );

    var task_config = await page.evaluate(
        (task_name) => {

            var candidates = [];

            currentTask = _pfreak.tasks[ task_name ];

            for( var candidate in currentTask.candidates ){
                candidates.push( candidate );
            }

            let category = currentTask.category || task_path_config.sub_folder;
            if( category.trim().length == 0 ) category = "Uncategorized"

            var browser_task_config = {};
            
            if( currentTask.setTaskData ){
                var tmp_config = currentTask.setTaskData(browser_task_config);
                if( tmp_config ) browser_task_config = tmp_config;
            }

            return {
                candidates: candidates,
                category: category,
                description: currentTask.description,
                cpu_slowdown: currentTask.cpu_slowdown,
                assert_delay: currentTask.assert_delay,
                browser_task_config: browser_task_config
            };
            
        },
        task_path_config.short_name
    );

    await page.close();

    return task_config;
}

export async function loadTask(config, page, task_path_config){
    await page.evaluate( 
        
        (task_file) => {

            if( !window._pfreak ){
                window._pfreak = {};

                window._pfreak.tasks = [];
                
                window._pfreak.clearBody = function(parent){
                    var non_script_elems = document.body.querySelectorAll(":not(script)");

                    for(var i = 0; i < non_script_elems.length; i++ ){
                        var elem = non_script_elems[i];

                        elem.parentNode.removeChild(elem);
                    }
                }

                window._pfreak.isTaskLoaded = function(task_short_name){

                    for(var i = 0; i < window._pfreak.tasks.length; i++ ){
                        if( window._pfreak.tasks[i].short_name == task_short_name ){
                            return true;
                        }
                    }

                    return false;
                }

                window._pfreak.getTaskIndexByName = function(task_short_name){

                    for(var i = 0; i < window._pfreak.tasks.length; i++ ){
                        if( window._pfreak.tasks[i].short_name == task_short_name ){
                            return i;
                        }
                    }

                    return -1;
                }
            }
            
            var script = document.createElement("script");
            script.src = task_file;

            document.body.appendChild(script);
        },

        path.resolve(task_path_config.path)
    );

    await page.waitForFunction( 
        (task_short_name) => {
            return typeof window._pfreak.isTaskLoaded(task_short_name) != 'undefined'
        },
        {},
        task_path_config.task_config.short_name
    );
}

export function createNewTask(initial_config){
    const tasks_path = path.join( initial_config.path_to_folder, "tasks" );
    var task_file_path = tasks_path;

    var task_name = "";

    if( initial_config.specific_tasks && initial_config.specific_tasks[0] ){
        task_name = initial_config.specific_tasks[0];
    }

    if( task_name.length == 0 ){
        logError("Task name is required");
        return;
    }

    var category = "";

    if( initial_config.specific_tasks && initial_config.specific_tasks[0] ){
        category = initial_config.specific_task_categories[0];
    }

    if( category.length != 0 ){
        task_file_path = path.join(task_file_path, category);

        makeDir( task_file_path );
    }

    task_file_path = path.join(task_file_path, task_name + ".js");

    if( fs.existsSync(task_file_path) ){
        logError("Task already exists. Aborting...");
        
        return;
    }

    const existing_tasks = getDirectoryTaskList( tasks_path, undefined, true );

    const local_task_template_path = path.join( tasks_path, "_task_template.js");

    if( !fs.existsSync( local_task_template_path) ){
        fs.copyFileSync(
            path.join( path.dirname(import.meta.url).substr(5), "./_task_template.js" ),
            local_task_template_path
        );
    }

    fs.copyFileSync(
        local_task_template_path,
        task_file_path
    );

    let new_file_content = fs.readFileSync(task_file_path).toString();

    var replaces = [
        [ "task_short_name", task_name ],
        [ "Category_Name", category ],
        [ "display_order: 0", "display_order: " + existing_tasks.length ]
    ]

    var candidate = "";

    if( initial_config.specific_candidates && initial_config.specific_candidates[0] ){
        replaces.push([
            "candidate_a",
            initial_config.specific_candidates[0]
        ]);
    }
    
    for( var i = 0; i < replaces.length; i++ ){
        var replacement = replaces[i];

        new_file_content = new_file_content.replace( replacement[0], replacement[1] );
    }

    fs.writeFileSync( task_file_path, new_file_content );

    log( `New Task: ${task_file_path}`);
}