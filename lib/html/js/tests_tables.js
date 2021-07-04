
function showTestsSummaryTable(title, results, show_remarks){

    var _thead, _tbody;

    var _table = _("+table")
        .attr({

        })
        .append(
            _thead = _("+thead"),
            _tbody = _("+tbody")
        );

    _thead.append(
        _("+th").text( "Task" )
    );
    
    for( var candidate in results.candidate_wise ){
        _thead.append(
            _("+th").text( candidate )
        );
    }

    if( show_remarks ){
        _thead.append(
            _("+th").text( "Remarks" )
        );
    }

    for( var task in results.task_candidate_wise ){
        var task_candidates = results.task_candidate_wise[task];

        var _tr = _("+tr")
            .append(
                _("+td").text(task)
            );

        for( var candidate in results.candidate_wise ){
            
            if( typeof task_candidates[candidate] != 'undefined' ){

                var total = task_candidates[candidate].passed + task_candidates[candidate].failed;

                _tr.append(
                    _("+td")
                        .text( task_candidates[candidate].passed.toLocaleString() + "/" + total.toLocaleString() )
                        .addClass( task_candidates[candidate].passed < total ? "failed-test" : "passed-test" )
                );
            }
            else{
                _tr.append(
                    _("+td")
                        .text( "-" )
                );
            }
        }

        // if( show_remarks ){

        //     var unique_task_id = category + "_" + task;

        //     _tr.append(
        //         _("+td")
        //             .addClass("remarks")
        //             .text( current_dataset.metadata.task_descriptions[unique_task_id] ? current_dataset.metadata.task_descriptions[unique_task_id] : "") 
        //     );
        // }

        _tbody.append( _tr );
    }

    var _tr = _("+tr")
            .append(
                _("+td").text("Overall")
            );
    
    for( var candidate in results.candidate_wise ){
        var total = results.candidate_wise[candidate].passed + results.candidate_wise[candidate].failed;

        _tr.append(
            _("+td")
                .text( 
                    results.candidate_wise[candidate].passed.toLocaleString() 
                    + "/" 
                    + total.toLocaleString()
                )
                .addClass( results.candidate_wise[candidate].passed < total ? "failed-test" : "passed-test" )
        );
    }

    _tbody.append( _tr );

    _("#tests-results").append( 
        _("+h3").text( title ),
        _table
    );
}


function showTestsDetailedTable(category, results){

    var _thead, _tbody;

    var _table = _("+table")
        .attr({

        })
        .append(
            _thead = _("+thead"),
            _tbody = _("+tbody")
        );

    _thead.append(
        _("+th").text( "Task" )
    );
    
    for( var candidate in results.candidate_wise ){
        _thead.append(
            _("+th").text( candidate )
        );
    }

    _thead.append(
        _("+th").text( "Description" ),
        _("+th").text( "Remarks" )
    );

    for( var task in results.task_candidate_wise ){
        var task_candidates = results.task_candidate_wise[task];

        var _tr = _("+tr")
            .append(
                _("+td").text(task)
            );

        for( var candidate in results.candidate_wise ){
            
            if( typeof task_candidates[candidate] != 'undefined' ){
                var passed = task_candidates[candidate].status === true;

                _tr.append(
                    _("+td")
                        .text( passed ? "✓" : "✗" )
                        .addClass( passed ? "passed-test" : "failed-test" )
                );
            }
            else{
                _tr.append(
                    _("+td")
                        .text( "-" )
                );
            }
        }

        var unique_task_id = category + "_" + task;

        _tr.append(
            _("+td")
                .addClass("remarks")
                .text( current_dataset.metadata.task_configs[unique_task_id] ? current_dataset.metadata.task_configs[unique_task_id].description : ""),

            _("+td")
                .addClass("remarks")
                .text( task_candidates[candidate] && task_candidates[candidate].error ? task_candidates[candidate].error : ""),

        );

        _tbody.append( _tr );
    }

    var _tr = _("+tr")
        .append(
            _("+td").text("Overall")
        );

    for( var candidate in results.candidate_wise ){
        var total = results.candidate_wise[candidate].passed + results.candidate_wise[candidate].failed;

        _tr.append(
            _("+td")
                .text( 
                    results.candidate_wise[candidate].passed.toLocaleString() 
                    + "/" 
                    + total.toLocaleString()
                )
                .addClass( results.candidate_wise[candidate].passed < total ? "failed-test" : "passed-test" )
        );
    }

    _tbody.append( _tr );

    _("#tests-results").append( 
        _("+h3").text( category ),
        _table
    );
}