function showBenchmarkResults(){

    var _results = _("#benchmark-results");

    _results.children().remove();

    var category_results = {};
    var overall_averages = {};

    var category_count = 0;

    unique_kpis = [];

    for( var category in current_dataset.result.benchmark ){
        category_results[category] = getSummarizedBenchmarkResults( current_dataset.result.benchmark[category] );
        overall_averages[category] = category_results[category].candidate_wise;

        category_count++;
    }

    setKPIUI(category_count);

    //Making candidate average an one-dimentional array to be compatible with getSummarizedResults()
    for(var overall_key in overall_averages ){
        for( var candidate in overall_averages[overall_key] ){
            overall_averages[overall_key][candidate] = [ overall_averages[overall_key][candidate] ];
        }
    }

    var overall_results = getSummarizedBenchmarkResults(overall_averages);

    if( !base_candidate_inited ){
        base_candidate_inited = true;

        var candidate_wise_array = [];
        candidate_count = 0;
        
        for( var candidate in overall_results.candidate_wise ){
            candidate_wise_array.push( {
                name: candidate,
                duration: overall_results.candidate_wise[candidate]  
            });

            _base_candidate_select.append(
                _("+option")
                    .attr( "value", candidate )
                    .text( candidate )
            );

            candidate_count++
        }

        // candidate_wise_array = candidate_wise_array.sort( function(a, b){
        //     return a.duration - b.duration;
        // });

        base_candidate = candidate_wise_array[0].name;
        _base_candidate_select.val( base_candidate );
    }
    
    _results
        .append( _("+h2")
            .text( "Overall Results" )
        );

    if( candidate_count > 1){
        showSlownessTable( "Slowness relative to " + base_candidate, overall_results );
    }
    showDurationTable( "Average execution duration in microseconds", overall_results );

    _results.append(
        _("+div").addClass("separator"),
        _("+p")
            .text("Click number cells below to view Devtools Timeline & Raw Trace Data. Reading ")
            .append(
                _("+a", ["Benchmark Mechanism"])
                    .attr("href", "#benchmark-mechanism"),

                " first would help to understand these results better."
            )
    );
    
    for( var category in category_results ){

        _results
            .append(
                
                _("+div").addClass("separator"), 
                _("+h2")
                    .text( category )
            );

        if( candidate_count > 1){
            showSlownessTable( "Slowness relative to " + base_candidate,  category_results[category], true, category );
        }
        
        showDurationTable( "Average execution duration in microseconds",  category_results[category], category, true, true, true );
    }
}

function setKPIUI(category_count){

    if( category_count == 0 || kpi_ui_inited ){
        return;
    }
    
    kpi_ui_inited = true;
    _("#benchmark-controls").addClass("visible");
    _("#benchmark-mechanism").addClass("visible");
    
    unique_kpis = unique_kpis.sort(function(a, b){
        if( a == "Scripting" ) return -1;
        return 1;
    });

    // <label for="kpi-Scripting">Scripting</label>
    // <input type="checkbox" id="kpi-Scripting" data-kpi="Scripting" checked />

    var _kpis = _("#kpis");

    for( var i = 0; i < unique_kpis.length; i++ ){
        var kpi = unique_kpis[i];

        if( kpi == "total" ) continue;

        var _check_box = _("+input")
            .attr({
                id: "kpi-" + kpi,
                type: "checkbox",
                "data-kpi": kpi
            })
            .on("change", onKPISelect );
        
        if( kpi == "Scripting" ) _check_box.attr("checked", true);
        
        _kpis.append(
            _("+label", [kpi])
                .attr("for", "kpi-" + kpi),
            _check_box
        );
    }
}

function onKPISelect(){
    selected_kpis = [];

    _("#kpis input[type=checkbox]").each( function(elem){
        if( elem.checked ){
            selected_kpis.push( elem.getAttribute("data-kpi") );
        }
    });

    if( typeof current_dataset != 'undefined' && current_dataset ) showResults();
}

function getSummarizedBenchmarkResults( results ){
    var task_candidate_wise = {};
    var candidate_wise = {};

    var dont_avg_candidate_wise = [ ];

    for( var task in results ){
        
        if( dont_avg_candidate_wise.indexOf(task) != -1) continue;
        
        var this_task = results[task];

        for( var candidate in this_task ){
            if( !task_candidate_wise[task] ) task_candidate_wise[task] = {};

            //Getting the average of candidate order combinations
            var value_array;

            if( this_task[candidate][0] && this_task[candidate][0].__processed_type === true ){
                value_array = this_task[candidate];
            }
            else{
                value_array = this_task[candidate].map(
                    function(iteration){
                        var duration = 0;

                        for( var kpi in iteration ){

                            var processed_kpi = isScriptingCategory(kpi) ? "Scripting" : kpi;

                            if( unique_kpis.indexOf(processed_kpi) == -1 ) unique_kpis.push(processed_kpi);

                            if( selected_kpis.indexOf(processed_kpi) != -1 ) duration += iteration[kpi];
                        }

                        return duration;
                    }
                );
            }
            
            var result = processResult(value_array);

            task_candidate_wise[task][candidate] = result ;

            if( dont_avg_candidate_wise.indexOf(task) == -1 ){
                if( !candidate_wise[candidate] ) candidate_wise[candidate] = [];
                candidate_wise[candidate].push( result );
            }
        }
    }

    for( var candidate in candidate_wise ){
        candidate_wise[candidate] = processResult( candidate_wise[candidate] );
    }

    return {
        "task_candidate_wise": task_candidate_wise,
        "candidate_wise": candidate_wise
    }
}


function isScriptingCategory(category_id){

    // Got this list from https://github.com/ChromeDevTools/devtools-frontend/blob/84442c6766618bdbe2de64f2fbcdd4309dad160d/front_end/panels/timeline/TimelineUIUtils.ts
    return category_id.substr(0, 2) == "f:"
        || category_id == "EventDispatch"
        || category_id == "TimerInstall"
        || category_id == "TimerRemove"
        || category_id == "TimerFire"
        || category_id == "XHRReadyStateChange"
        || category_id == "XHRLoad"
        || category_id == "CompileScript"
        || category_id == "EvaluateScript"
        || category_id == "CompileModule"
        || category_id == "EvaluateModule"
        || category_id == "StreamingCompileScriptParsing"
        || category_id == "WasmStreamFromResponseCallback"
        || category_id == "WasmCompiledModule"
        || category_id == "WasmCachedModule"
        || category_id == "WasmModuleCacheHit"
        || category_id == "WasmModuleCacheInvalid"
        || category_id == "MarkLoad"
        || category_id == "MarkDOMContent"
        || category_id == "TimeStamp"
        || category_id == "ConsoleTime"
        || category_id == "UserTiming"
        || category_id == "RunMicrotasks"
        || category_id == "FunctionCall"
        || category_id == "GCEvent"
        || category_id == "MajorGC"
        || category_id == "MinorGC"
        || category_id == "JSFrame"
        || category_id == "RequestAnimationFrame"
        || category_id == "CancelAnimationFrame"
        || category_id == "FireAnimationFrame"
        || category_id == "RequestIdleCallback"
        || category_id == "CancelIdleCallback"
        || category_id == "FireIdleCallback"
        || category_id == "WebSocketCreate"
        || category_id == "WebSocketSendHandshakeRequest"
        || category_id == "WebSocketReceiveHandshakeResponse"
        || category_id == "WebSocketDestroy"
        || category_id == "EmbedderCallback"
        || category_id == "LatencyInfo"
        || category_id == "GCCollectGarbage"
        || category_id == "CryptoDoEncrypt"
        || category_id == "CryptoDoEncryptReply"
        || category_id == "CryptoDoDecrypt"
        || category_id == "CryptoDoDecryptReply"
        || category_id == "CryptoDoDigest"
        || category_id == "CryptoDoDigestReply"
        || category_id == "CryptoDoSign"
        || category_id == "CryptoDoSignReply"
        || category_id == "CryptoDoVerify"
        || category_id == "CryptoDoVerifyReply";
}