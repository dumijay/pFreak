function showSlownessTable(title, results, show_trace_data, category){

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
                var avg = Math.round( (task_candidates[candidate].mean / task_candidates[base_candidate].mean) * 10 ) / 10;

                var _td = _("+td")
                    .text(avg)
                    .css("background", getColor(avg) );
        
                if( show_trace_data ){
                    _td
                        .addClass("cursor-pointer")
                        .attr({
                            "data-category": category,
                            "data-task": task,
                            "data-candidate": candidate,
                            "title": "View Timeline & Raw Traces"
                        })
                        .on("click", function(e){
                            var _this = _(e.target);

                            showRawTraces( 
                                _this.attr("data-category"),
                                _this.attr("data-task"),
                                _this.attr("data-candidate")
                            );
                        });
                }

                _tr.append( _td );
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
        if( Array.isArray(results.candidate_wise[candidate]) ){
            results.candidate_wise[candidate] = results.candidate_wise[candidate][0];
        };

        var avg = Math.round( (results.candidate_wise[candidate].mean / results.candidate_wise[base_candidate].mean) * 10 ) / 10;

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

function showDurationTable(title, results, category, show_remarks, show_cv, show_trace_data){

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
                var avg = Math.round( (task_candidates[candidate].mean ) * 1000 );

                var avg_txt = avg.toLocaleString();

                if( show_cv ){
                    avg_txt += '<p class="' + (task_candidates[candidate].cv > 5 ? "orange-text" : "") + '">± ' + task_candidates[candidate].cv + "%</p>";
                }

                var _td = _("+td").html( avg_txt );

                if( show_trace_data ){
                    _td
                        .addClass("cursor-pointer")
                        .attr({
                            "data-category": category,
                            "data-task": task,
                            "data-candidate": candidate,
                            "title": "View Timeline & Raw Traces"
                        })
                        .on("click", function(e){
                            var _this = _(e.target);

                            showRawTraces( 
                                _this.attr("data-category"),
                                _this.attr("data-task"),
                                _this.attr("data-candidate")
                            );
                        });
                }

                _tr.append(
                    _td
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
        if( Array.isArray(results.candidate_wise[candidate]) ){
            results.candidate_wise[candidate] = results.candidate_wise[candidate][0]
        }

        var avg = Math.round( (results.candidate_wise[candidate].mean ) * 1000 );

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