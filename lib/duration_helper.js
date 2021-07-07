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
    //     logWarning("\nDevtoolsTimelineModel Failed. Probably because the tracing started in a middle of an execution. Not considering as a test error.");
    //     console.trace(e);
        
    //     return duration;
    // }
    
    const top_down = model.topDown();
    
    top_down.children.forEach( category => {
        var category_id = category.id;

        //Decided to keep the categories as it is and process it in the results page
        // if( isScriptingCategory(category_id) ) category_id = "Scripting";

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

function isScriptingCategory(category_id){

    // Got this list from https://github.com/ChromeDevTools/devtools-frontend/blob/84442c6766618bdbe2de64f2fbcdd4309dad160d/front_end/panels/timeline/TimelineUIUtils.ts
    return category_id.substr(0, 2) == "f:"
        || category_id == "EventDispatch"
        || category_id == "TimerInstall"
        || category_id == "TimerRemove"
        || category_id == "TimerFire"
        || category_id == "XHRReadyStateChange"
        || category_id == "XHRLoad"
        || category_id == "CompileScript"
        || category_id == "EvaluateScript"
        || category_id == "CompileModule"
        || category_id == "EvaluateModule"
        || category_id == "StreamingCompileScriptParsing"
        || category_id == "WasmStreamFromResponseCallback"
        || category_id == "WasmCompiledModule"
        || category_id == "WasmCachedModule"
        || category_id == "WasmModuleCacheHit"
        || category_id == "WasmModuleCacheInvalid"
        || category_id == "MarkLoad"
        || category_id == "MarkDOMContent"
        || category_id == "TimeStamp"
        || category_id == "ConsoleTime"
        || category_id == "UserTiming"
        || category_id == "RunMicrotasks"
        || category_id == "FunctionCall"
        || category_id == "GCEvent"
        || category_id == "MajorGC"
        || category_id == "MinorGC"
        || category_id == "JSFrame"
        || category_id == "RequestAnimationFrame"
        || category_id == "CancelAnimationFrame"
        || category_id == "FireAnimationFrame"
        || category_id == "RequestIdleCallback"
        || category_id == "CancelIdleCallback"
        || category_id == "FireIdleCallback"
        || category_id == "WebSocketCreate"
        || category_id == "WebSocketSendHandshakeRequest"
        || category_id == "WebSocketReceiveHandshakeResponse"
        || category_id == "WebSocketDestroy"
        || category_id == "EmbedderCallback"
        || category_id == "LatencyInfo"
        || category_id == "GCCollectGarbage"
        || category_id == "CryptoDoEncrypt"
        || category_id == "CryptoDoEncryptReply"
        || category_id == "CryptoDoDecrypt"
        || category_id == "CryptoDoDecryptReply"
        || category_id == "CryptoDoDigest"
        || category_id == "CryptoDoDigestReply"
        || category_id == "CryptoDoSign"
        || category_id == "CryptoDoSignReply"
        || category_id == "CryptoDoVerify"
        || category_id == "CryptoDoVerifyReply";
}