function showBenchmarkResults(){

    var _results = _("#benchmark-results");

    _results.children().remove();

    var category_results = {};
    var overall_averages = {};

    var category_count = 0;

    for( var category in current_dataset.result.benchmark ){
        category_results[category] = getSummarizedBenchmarkResults( current_dataset.result.benchmark[category] );
        overall_averages[category] = category_results[category].candidate_wise;

        category_count++;
    }

    if( category_count == 0 ){
        return;
    }
    else{
        _("#benchmark-controls").addClass("visible");
    }

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
    
    for( var category in category_results ){

        _results
            .append( _("+h2")
                .text( category )
            );

        if( candidate_count > 1){
            showSlownessTable( "Slowness relative to " + base_candidate,  category_results[category] );
        }
        
        showDurationTable( "Average execution duration in microseconds",  category_results[category], category, true );
    }
}

function getSummarizedBenchmarkResults( results ){
    var task_candidate_wise = {};
    var candidate_wise = {};

    var dont_avg_candidate_wise = [ ];

    for( var task in results ){
        var this_task = results[task];

        for( var candidate in this_task ){
            if( !task_candidate_wise[task] ) task_candidate_wise[task] = {};

            //Getting the average of candidate order combinations
            var value_array;

            if( isNaN(this_task[candidate][0]) ){
                value_array = this_task[candidate].map(
                    function(iteration){
                        var duration = 0;

                        for( var kpi in iteration ){
                            if( selected_kpis.indexOf(kpi) != -1 ) duration += iteration[kpi];
                        }

                        return duration;
                    }
                );
            }
            else{
                value_array = this_task[candidate];
            }
            
            var avg = average( value_array );

            task_candidate_wise[task][candidate] = avg ;

            if( dont_avg_candidate_wise.indexOf(task) == -1 ){
                if( !candidate_wise[candidate] ) candidate_wise[candidate] = [];
                candidate_wise[candidate].push( avg );
            }
        }
    }

    for( var candidate in candidate_wise ){
        candidate_wise[candidate] = average( candidate_wise[candidate] );
    }

    return {
        "task_candidate_wise": task_candidate_wise,
        "candidate_wise": candidate_wise
    }
}