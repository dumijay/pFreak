_pfreak.tasks.push({

    short_name: "task_short_name",
    display_order: 0,
    category: "Category_Name",
    description: "",
    assert_delay: 0,

    setTaskData: function(config){
        return config;
    },
    
    candidateSetup: function(config){
        _pfreak.clearBody();

        // This is useful to benchmark small tasks by repeating them multiple times to increase the execution duration.
        // In test-only mode, the provided config is already set to config.repeats = 1 to save time.
        config.repeats = config.repeats || 1;

        return config;
    },
    
    candidates: {
        "candidate_a": function(config){
            // Do something..
        }
    },

    assert: function(config, test_return){
        if( test_error ) throw false;
    },

    reset: function(){
        _pfreak.clearBody();
    }
});