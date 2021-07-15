# 0.3.3 Change Log
## Fixed
* Init: Missing empty_page.html fix.

# 0.3.2 Change Log

## Added
* CLI: Added --headless flag Accepts true or false.
* CLI: Added --keep-tab flag Accepts true or false. If true, headless is set to false and keeping the browser tab(s) open after test/benchmark. This is useful to examine failures.
* Benchmark: Added task_config.load_libraries = true or false. This is true by default. If set to false, pFreak will not load libraries defined in the config.json. This is useful to benchmark library loading times & initiation.

## Changes
* Results: All KPIs are now selected by default.

## Fixed
* Results: Fixed base candidates list not populating correctly if some categories excluded in the overall results.
* Results: Fixed NaN in overall slowness table when selected different base candidates.

# 0.3.1 Change Log

## Added
* Results: Added coefficient of variation (How much iterations deviate from its mean execution duration).
* Results: Devtools Timeline & raw trace data JSON file is now easy to access via a popup by clicking on the number cells.
* Benchmark Engine: Trying multiple times after a task iteration fail. This is useful to over come issues like dynamic file loading failures & DevtoolsTimelineModel errors (refer below).
* Benchmark Engine: Added task_config.repeat = <number> support. This is useful to benchmark small tasks by repeating them multiple times to increase the execution duration. This can be set to 1 during only-testing mode. (refer _task_template.js)

## Changes
* Benchmark Engine: Added all JavaScript trace types available at the github.com/ChromeDevTools/devtools-frontend
    * All traces types will be included in the results & categorization is now performed when displaying results.
* Results: KPI types now populate based on available trace data instead of previous fixed set at index.html
* Increased waiting time after the start of Tracing. 
    * Sometimes the DevtoolsTimelineModel throws an error.
    * The task is set to as failed when that happen & excluded from the results.
    * Re-running the benchmark on that specific task works.
    * Exact reason behind this is not clear. Probably because the tracing started middle of an execution.