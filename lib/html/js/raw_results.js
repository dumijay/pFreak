function showRawData(){
    
    var _raw_data = _("#raw-data");
    _raw_data.children().remove();

    for( var category in current_dataset.result.benchmark ){
        var this_category = current_dataset.result.benchmark[category];
   
        for( var task in this_category ){
            var this_task = this_category[task];

            _raw_data.append(
                _("+li").text( task )
            );

            var _task_ul = _("+ul");

            for( var candidate in this_task ){

                var this_candidate = this_task[candidate];

                for( var iteration = 0; iteration < this_candidate.length; iteration++ ){

                    var file_name = category + "_" + task + "_" + candidate + "_" + iteration + ".json";

                    _task_ul.append(
                        _("+li")
                            .append(
                                _("+a")
                                    .text(file_name)
                                    .attr({
                                        "href": "traces/" + file_name,
                                        "target": "_blank"
                                    }),
                                
                                " | ",

                                _("+a")
                                    .text("View Timeline")
                                    .attr({
                                        "href": "./timeline-viewer/?loadTimelineFromURL=" + window.location.href + "traces/" + file_name,
                                        "target": "_blank"
                                    })
                            )
                    );
                }
            }

            _raw_data.append( _task_ul );
        }
    }
}

function showPfreakConfig(){
    _("#pfreak-config")
        .html('')
        .text(
            JSON.stringify( current_dataset.metadata.config, null, 2)
        );
}