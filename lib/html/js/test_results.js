function showTestResults(){

    var _results = _("#tests-results");
    _results.children().remove();

    var category_results = {};
    var overall_averages = {};

    for( var category in current_dataset.result.tests ){
        category_results[category] = getSummarizedTestResults( current_dataset.result.tests[category] );
        overall_averages[category] = category_results[category].candidate_wise;
    }

    var overall_results = getSummarizedTestResults(overall_averages);

    showTestsSummaryTable( "Tests Summary", overall_results );

    for( var category in category_results ){

        _results
            .append( 

                _("+div").addClass("separator"),
                _("+h2")
                    .text( "Test Details" )
            );

            showTestsDetailedTable( category,  category_results[category] );
    }
}

function getSummarizedTestResults( results ){
    var task_candidate_wise = {};
    var candidate_wise = {};

    for( var task in results ){
        var this_task = results[task];

        task_candidate_wise[task] = {};

        for( var candidate in this_task ){
            task_candidate_wise[task][candidate] = this_task[candidate];

            if( !candidate_wise[candidate] ) candidate_wise[candidate] = {
                passed: 0,
                failed: 0
            }
    
            if( this_task[candidate].passed !== undefined ){ //Already processed once through getSummarizedTestResults
                candidate_wise[candidate].passed += this_task[candidate].passed;
                candidate_wise[candidate].failed += this_task[candidate].failed;
            }
            else{
                if( this_task[candidate].status === true ){
                    candidate_wise[candidate].passed++;
                }
                else{
                    candidate_wise[candidate].failed++;
                }
            }
        }
    }

    return {
        "task_candidate_wise": task_candidate_wise,
        "candidate_wise": candidate_wise
    }
}