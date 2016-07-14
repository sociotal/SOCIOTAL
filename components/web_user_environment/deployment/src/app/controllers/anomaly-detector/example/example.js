var detector = require('../lib/index.js');

var options = detector.default_options;
var tolerance = 0.05;

// initialize detector
detector.init(options, function(){
    
    // training classifier for 3 separate random variables
    var random_variables = {
        'a' : [ 24.1, 24.2,24.1, 24.2,24.1, 24.2,24.1, 24.2,24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9],
        'b' : [ -12, 130, 125, 200, 128, 118, 119 ],
        'c' : [ 110, 115, 113, 114, 90, 116, 90 ]
    };
    detector.train(random_variables, function(){
        
        // testing
        var variable_id = 'a';
        //var testing_values = [50, 70, 90, 110, 130, 150, 170];
        var testing_values = [27];

        var counter = 0;
        for (var i = 0; i < testing_values.length; i++) {
            var value = testing_values[i];

            // test whether values is ok or an outlier
            detector.test(variable_id, variable_id, value, function(id, v_id, v, result) {

                var maxValue = Math.max.apply(Math, random_variables[variable_id]);
                var minValue = Math.min.apply(Math, random_variables[variable_id]);
                var maxEdge = maxValue + maxValue*tolerance;
                var minEdge = minValue - minValue*tolerance;

                console.log(maxValue, maxEdge);
                console.log(minValue, minEdge);

                console.log(v, result);


                if (result == false){
                    if (minEdge < value && value < maxEdge ){
                        result = true;
                    }
                }


                console.log(v, result);
                
                // if all tests are done, close dataSource connection
                if (counter++ === (testing_values.length - 1)) {
                    detector.close();
                } 
            });
        }
    });
});