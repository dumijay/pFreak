var current_dataset;
var _base_candidate_select, _kpi_checkboxes;
var base_candidate_inited = false;
var base_candidate = null;
var selected_kpis = [];
var candidate_count;

function main(){
    initEvents();
    loadResults();
}

function initEvents(){

    _base_candidate_select = _("#base-candidate-select")
        .on("change", onBaseCandidateSelect);

    _kpi_checkboxes = _("#kpis input[type=checkbox]")
        .on("change", onKPISelect );

    onKPISelect();
}

function onKPISelect(){
    selected_kpis = [];

    _kpi_checkboxes.each( function(elem){
        if( elem.checked ){
            selected_kpis.push( elem.getAttribute("data-kpi") );
        }
    });

    if( typeof current_dataset != 'undefined' && current_dataset ) showResults();
}

function onBaseCandidateSelect(e){
    base_candidate = e.target.value;

    if( current_dataset ) showResults();
}

function showResults(){
    showBenchmarkResults();
    showTestResults();

    showRawData();
    showPfreakConfig();
}

function loadResults(){
    loadJSON( "./results.json", function(data){
        current_dataset = data;
        showResults();
    });
}

main();
