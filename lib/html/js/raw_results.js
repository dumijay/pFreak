function initTracesPopup(){
    _(".close-button, .back-overlay")
        .on("click", hideRawTraces)
}

function showRawTraces(category, task, candidate){

    var this_category = current_dataset.result.benchmark[category];
    var this_task = this_category[task];
    var this_candidate = this_task[candidate];

    _("#raw-traces-list")
        .html('')
        .append(
            this_candidate.map( (iteration, i) => {

                var file_name = category + "_" + task + "_" + candidate + "_" + i + ".json";

                return _("+li")
                    .append(
                        _("+a")
                            .text("Raw JSON")
                            .attr({
                                "href": "traces/" + file_name,
                                "target": "_blank"
                            }),
                        
                        " | ",

                        _("+a")
                            .text("View Devtools Timeline")
                            .attr({
                                "href": "./timeline-viewer/?loadTimelineFromURL=" + window.location.protocol + "//" + window.location.host + window.location.pathname + "traces/" + file_name,
                                "target": "_blank"
                            })
                    );
            })
        );

    _(".back-overlay").addClass("visible");
    _("#raw-traces-popup").addClass("visible");
}

function hideRawTraces(){
    _(".back-overlay").removeClass("visible");
    _("#raw-traces-popup").removeClass("visible");
}

function showPfreakConfig(){
    _("#pfreak-config")
        .html('')
        .text(
            JSON.stringify( current_dataset.metadata.config, null, 2)
        );
}