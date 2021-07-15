var current_dataset;
var _base_candidate_select;
var base_candidate_inited = false;
var base_candidate = null;

var unique_kpis = [];
var selected_kpis = [];
var kpi_ui_inited = false;

var candidate_count;

function main(){
    initEvents();
    loadResults();
    initTracesPopup();
}

function initEvents(){

    _base_candidate_select = _("#base-candidate-select")
        .on("change", onBaseCandidateSelect);
}

function onBaseCandidateSelect(e){
    base_candidate = e.target.value;

    if( current_dataset ) showResults();
}

function showResults(){
    showBenchmarkResults();
    showTestResults();

    showPfreakConfig();
}

function loadResults(){
    loadJSON( 
        "./results.json", 
        function(data){
            _("#status-indicator")
                .addClass("hidden");

            _("#pfreak-data, #footer-note")
                .addClass("visible");

            current_dataset = data;
            showResults();

        },

        onJSONLoadFail
    );
}

function onJSONLoadFail(){
    _("#status-indicator")
        .html('')
        .append(
            _("+p")
                .text("Couldn't load results.json file.")
        )
}

main();
