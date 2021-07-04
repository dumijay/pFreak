import DevtoolsTimelineModel from "devtools-timeline-model";
import fs from "fs";

import { logWarning } from "./common.js"

// import Tracelib from 'tracelib'
// import JANK_TRACE_LOG from '../output/traces/caldom_append_multiple_elems.json'

const metric_categories = {
    "Layout": "Rendering",
    "UpdateLayerTree": "Rendering",
    "UpdateLayoutTree": "Rendering",
    "UpdateLayer": "Rendering",
    "CompositeLayers": "Painting",
    "Paint": "Painting",
    "EvaluateScript": "Scripting",
    "v8.compile": "Scripting", 
    "EventDispatch": "Scripting",
}

export default function getDuration(stringBuffer){

    let duration = {
        total: 0
    }

    let trace_data = JSON.parse( stringBuffer.toString() );

    var model
    // try{
        model = new DevtoolsTimelineModel( trace_data );
    // }
    // catch(e){
    //     logWarning("\nDevtoolsTimelineModel Failed. Probably because the task executed too quickly. Not considering as a test error.");
    //     console.trace(e);
        
    //     return duration;
    // }
    
    const top_down = model.topDown();

    // console.log(top_down);
    
    top_down.children.forEach( category => {
        var category_id = category.id;
        if( category_id.substr(0, 2) == "f:" ) category_id = "Scripting";
        if( category_id == "FireAnimationFrame" ) category_id = "Scripting";

        if( !duration[category_id] ) duration[category_id] = 0;

        duration[category_id] += category.totalTime;
        duration.total += category.totalTime;
    });

    if( duration.total / top_down.totalTime < 0.999 ){
        console.log("Warning: Duration totals mismatch.");
        console.log(top_down);
    }

    return duration;
    
    trace_data.traceEvents.forEach( event => {
        if( event.ph != "X") return; //X == Complete

        let category_name = metric_categories[event.name];
        if( !category_name ) category_name = event.name;

        if( category_name != undefined ){

            if( !duration[category_name] ) duration[category_name] = 0;

            var event_duration = parseFloat(event.dur);

            duration[category_name] += event_duration
            duration["total"] += event_duration
        }
    });
    
    return duration;
}