var debug = require('debug')('anomaly-detector:anomalyDetectorImplementation');

/**
 * Module dependencies.
 */

var detector = require('./lib/index.js');
var options = {data_source : {name : 'memory'}};
//var options = detector.default_options;
var tolerance = 0.05;                    // 30% tolerance from the edge of the gaussian curve
                                          // the tolerance fixes the bugs related to the false positive values: I.E.
                                          // when temp is > 3*sigma but is considered a valid temperature that could rise up an anomaly exception
                                          // increase tolerance as much as you prefer.


function range(start, end) {
    var foo = [];
    for (var i = start; i <= end; i++) {
        foo.push(i);
    }
    return foo;
}

exports.getAnomalies = function (req, t_set, _test_value, cb) {     //inbox is the array data of the channel (a lot of data)
    var training_set = t_set;
    var test_value = JSON.parse(JSON.stringify(_test_value));   // cloning _test_value

    debug("***Training Variables: "+JSON.stringify(training_set));
    debug("***Validation before test: " + test_value.valid);

    detector.init(options, function () {
        detector.train(training_set, function () {
            return detector.test(test_value.data_type, test_value.id, test_value.value, function (d_id, v_id, v, res) {
                detector.close();
                test_value.valid = res;

                var t_set = training_set[test_value.data_type];

                var maxValue = Math.max.apply(Math, t_set);
                var minValue = Math.min.apply(Math, t_set);
                var maxEdge = maxValue + maxValue*tolerance;
                var minEdge = minValue - minValue*tolerance;

                debug("MAX limits: ", maxValue, maxEdge);
                debug("MIN limits", minValue, minEdge);

                debug("***Validation test BEFORE tolerance: " + test_value.valid);

                if (test_value.valid == false){
                    if (minEdge < test_value.value && test_value.value < maxEdge ){
                        test_value.valid = true;
                    }
                }

                debug("***Validation test AFTER tolerance: " + test_value.valid);
                
                cb(test_value, req);
              }
            );
        })
    });


}
