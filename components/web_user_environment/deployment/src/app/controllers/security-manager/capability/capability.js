var util = require('util');
var path = require("path");
var debug = require('debug')('controllers:capability-client');

var java = require("java");
var url = require('url');



function createCapabilityToken(_url){
    var host = url.parse(_url).hostname;
    var port = url.parse(_url).port;
    var path = url.parse(_url).path;
    var method =   "POST";
    var protocol = url.parse(_url).protocol;


    var result = JSON.stringify({"de": protocol+'//'+host+':'+port,
        "id": "geqe3k0pl1oj4i14idhuqg8am4",
        "is": "capabilitymanager@um.es",
        "na": 1563534433,
        "nb": 1433534333,
        "su": "QKkWEGvhwkn4wubbkASz6DT04ukliJbOXkDGCcqCLdk=TX+91sWv/3eZP5fwjO7wv0x4+FD6uRtOcBRGLwjkWCo=",
        "ii": 1433534333,
        "ar": [{
            "ac": method,
            "re": path,
        }],

        "si": "MEUCIQDCJDKXp9RkYZLkmge/vFfzFTcjtTobVi2ypSwkmW+t/QIgBpWRaL61Ya6LFOhhZ0QyUjCvAxiPBuLAX6yLbEVeh40="
    })

    return result;

}
// export the class
exports.requestToken = function(resource_url, _cb) {
//function request(){
    debug("capability request");
    debug("resource_url:" + resource_url);
    var certificate = 'umu';
    var action = 'POST';
    //var resource_url = 'http://193.144.201.50:3500/SocIoTal_CM_REST_V2/NGSI10_API/queryContext/SocIoTal:SAN:WeatherStation:Dev_001';
    var t = createCapabilityToken(resource_url);
    _cb(t);

    /*
    ATTENZIONE: sul context manager non è ancora attivo il controllo sui token generati quindi i nuovi token non verranno riconosciuti

    var list = java.newInstanceSync("java.util.ArrayList");

    var capabilityClient = java.newInstanceSync("org.umu.capabilityclient.HTTPSCapabilityClient",
                            path.resolve(__dirname, "CapabilityClient_config.txt"));

    var action = "GET";
    capabilityClient.ownToken(action, resource_url, function(err, result) {
        if (result !== null) {
            debug('token already exists: ');
            debug(result.toStringSync());
            var t = util.inspect(JSON.parse(result.toStringSync()));
            _cb(t);
        } else {

            debug('No Token: ', err);
            debug('New request to capability manager...');
            var certificate ="umu";
            capabilityClient.requestCapabilityToken(certificate, action, resource_url, '155.54.210.166', function (err, result) {
                if (!err) {
                    debug('New token generated: ');
                    debug(result);

                    capabilityClient.ownToken(action, resource_url, function (err, result) {
                        if (!err) {
                            debug('ownToken Token is: ', result.toStringSync());
                            debug('type: ', typeof result);
                            debug('received Token: ', util.inspect(JSON.parse(result.toStringSync())));
                            //return result;
                            var t = util.inspect(JSON.parse(result.toStringSync()));
                            _cb(t);
                        } else {
                            debug('ownToken Error is: ', err);
                        }
                    });


                }
                else {
                    debug('Error is: ', err);
                }

            });
        }
    });
     */

};
