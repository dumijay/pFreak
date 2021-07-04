function showSlownessTable(title, results){

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

    for( var task in results.task_candidate_wise ){
        var task_candidates = results.task_candidate_wise[task];

        var _tr = _("+tr")
            .append(
                _("+td")
                    .text(task)
            );

        for( var candidate in results.candidate_wise ){
            
            if( typeof task_candidates[candidate] != 'undefined' ){
                var avg = Math.round( (task_candidates[candidate] / task_candidates[base_candidate]) * 10 ) / 10;

                _tr.append(
                    _("+td")
                        .text(avg)
                        .css("background", getColor(avg) )
                );
            }
            else{
                _tr.append(
                    _("+td")
                        .text( "-" )
                        .css("background", "#f7f7f7")
                );
            }
        }

        _tbody.append( _tr );
    }

    var _tr = _("+tr")
            .append(
                _("+td").text("Overall")
            );
    
    for( var candidate in results.candidate_wise ){
        var avg = Math.round( (results.candidate_wise[candidate] / results.candidate_wise[base_candidate]) * 10 ) / 10;

        _tr.append(
            _("+td")
                .text( avg )
                .css("background", getColor(avg) )
        );
    }

    _tbody.append( _tr );

    _("#benchmark-results").append( 
        _("+h3").text( title ),
        _table
    );
}

function showDurationTable(title, results, category, show_remarks){

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
            _("+th").text( "Description" )
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
                var avg = Math.round( (task_candidates[candidate] ) * 10000 ) / 10;

                _tr.append(
                    _("+td").text( avg.toLocaleString() )
                );
            }
            else{
                _tr.append(
                    _("+td")
                        .text( "-" )
                );
            }
        }

        if( show_remarks ){
            var unique_task_id = category + "_" + task;

            _tr.append(
                _("+td")
                    .addClass("remarks")
                    .text( current_dataset.metadata.task_configs[unique_task_id] ? current_dataset.metadata.task_configs[unique_task_id].description : "")
            );
        }

        _tbody.append( _tr );
    }

    var _tr = _("+tr")
            .append(
                _("+td").text("Average")
            );
    
    for( var candidate in results.candidate_wise ){
        var avg = Math.round( (results.candidate_wise[candidate] ) * 10000 ) / 10;

        _tr.append(
            _("+td")
                .text( avg.toLocaleString() )
        );
    }

    _tbody.append( _tr );

    _("#benchmark-results").append( 
        _("+h3").text( title ),
        _table
    );
}

function getColor(avg){
    var alpha = 0.7;

    if( avg >= 4 ) return "rgba(128, 0, 0, " + alpha + ")";
    if( avg >= 3 ) return "rgba(255, 0, 0, " + alpha + ")";
    if( avg >= 2 ) return "rgba(192, 64, 0, " + alpha + ")";
    if( avg > 1 ) return "rgba(255, 255, 0, " + alpha + ")";
    
    return "rgba(0, 255, 0, " + alpha + ")";
}

function average(arr){
    var sum = 0;
    var count = 0;

    for(var i = 0; i < arr.length; i++ ){
        
        if( !isNaN(arr[i]) ){
            sum += arr[i];
            count++;
        }
    }

    return sum / count;
}