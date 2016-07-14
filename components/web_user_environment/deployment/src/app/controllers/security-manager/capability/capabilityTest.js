var util = require('util');
var path = require("path");
var debug = require('debug')('controllers:capability');

var java = require("java");
var url = require('url');
var fs = require('fs');



var libs_path = __dirname + '/libs'
fs.readdirSync(libs_path).forEach(function (file) {
    if (~file.indexOf('.jar'))
        java.classpath.push(path.resolve(__dirname, "./libs/" + file));
});
java.classpath.push("../../identity/jar/IdM_Admin_v0.4.1.jar");


java.import('java.security.NoSuchProviderException');
java.import('java.security.UnrecoverableKeyException');

java.import('org.bouncycastle.operator.OperatorCreationException');
java.import('org.umu.https.capabilityclient.CapabilityToken');
java.import('org.umu.https.capabilityclient.HTTPSCapabilityClient');
java.import('org.umu.https.capabilityclient.NGSI_ACTION');
java.import('org.umu.https.contextmanager.client.HTTPSContextManagerClient');

java.import('user.es.um.security.idm.IdMUser');
java.import('user.es.um.security.idm.IdMUserException');
java.import('user.es.um.security.idm.implementation.KeyRockIdMUserClient');
java.import('user.es.um.security.idm.tokens.Token');



var CERTS_FOLDER = "certs_sociotal/";
var CAPABILITY_TOKENS_FOLDER = "capability_tokens/";

var KEYSTORE_PASSWORD = "lxxekBfcFPBZW6XdZNfV";

var CAPABILITY_MANAGER_ADDRESS = "https://sociotal.inf.um.es:8443/CapabilityManagerServlet/CapabilityManager";

var client_id = "d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a";

//var client_id = "9af78f4f-3ee9-4ef3-ba93-ba226939d5cd";
//var token_id = "80b25cd0240d4dffbbcbc7bc3d35c487";

var client_password = "passw0rdCl1ent";

var identityManagerUSer =  java.newInstanceSync("user.es.um.security.idm.implementation.KeyRockIdMUserClient");
var auth_token = identityManagerUSer.authenticateSync(client_id, client_password);
//
var token_id = auth_token.getToken_idSync();
debug("new AuthToken id: " + token_id);



var new_entity = {
    "contextElements": [{
        "type": "urn:x-org:sociotal:resource:device",
        "isPattern": "false",
        "id": "SocIoTal:CRS4:WeatherStation:AM_03"

    }],
    "updateAction": "DELETE"
}





var delete_payload = {
    "id": "SocIoTal:CRS4:WeatherStation:AM_02"
    ,"registrationId": "56cc122ed914bb2307c44b9a"
}

var query_context = {"entities":[{"type":"","isPattern":"true","id":"SocIoTal:.*"}]};


var query_contextWS = {"entities":[
    {"type":"",
        "isPattern":"false",
        "id":"SocIoTal:IoTWeek:WeatherStation:Dev_001"
    }
],
    "attributes":["AmbientTemperature"]
};

var subscription = {
    "entities": [{
        "type": "urn:x-org:sociotal:resource:device",
        "isPattern": "false",
        "id": "SocIoTal:IoTWeek:WeatherStation:Dev_001"
    }],
    "reference": "http://SocIoTal_CM_V2_IP:PORT/Callback_Apps/Listeners/LogWriterFile", //please write here your reference listener
    "duration": "P1M",
    "notifyConditions": [{
        "type": "ONCHANGE",
        "condValues": ["AmbientTemperature"]
    }],
    "throttling": "PT5S"
};

var unsubscription = {
    "subscriptionId" : "56d557c1d914bb2307c44ba4"
}

var options = {

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/EXTENDED/queryContext/SocIoTal:IoTWeek:WeatherStation:Dev_001",
    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/EXTENDED/queryContext",
    //ngsi_action: "queryContext",
    //context_id : "", //arrUrl[arrUrl.length-1],
    //payload: JSON.stringify(query_context),


    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/EXTENDED/createContextEntity",
    //ngsi_action: "createContextEntity",
    //context_id : new_entity.entity.id, //"SocIoTal:CRS4:WeatherStation:AM_02",
    //payload: JSON.stringify(new_entity),

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/EXTENDED/queryContext/SocIoTal:CRS4:WeatherStation:AM_02",
    //ngsi_action: "queryContext",
    //context_id : "SocIoTal:CRS4:WeatherStation:AM_02",
    // payload: null,

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/EXTENDED/deleteContextEntity",
    //ngsi_action: "deleteContextEntity",
    //context_id : "SocIoTal:CRS4:WeatherStation:AM_02",
    //payload: JSON.stringify(delete_payload),



    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/queryContext",
    //ngsi_action: "queryContext",
    //context_id : "*",
    //payload: JSON.stringify(query_context),

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/queryContext",
    //ngsi_action: "queryContext",
    //context_id : "SocIoTal:CRS4:WeatherStation:AM_03",
    //payload: JSON.stringify(query_contextWS),


    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/queryContext",
    //ngsi_action: "queryContext",
    //context_id : "SocIoTal:IoTWeek:WeatherStation:Dev_001",
    //payload: JSON.stringify(query_contextWS),

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/updateContext",
    //ngsi_action: "updateContext",
    //context_id : "SocIoTal:CRS4:WeatherStation:AM_03",
    //payload: JSON.stringify(new_entity),

    //resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/subscribeContext",
    //ngsi_action: "subscribeContext",
    //context_id : "SocIoTal:IoTWeek:WeatherStation:Dev_001",
    //payload: JSON.stringify(subscription),

    resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/unsubscribeContext",
    ngsi_action: "unsubscribeContext",
    context_id : "SocIoTal:IoTWeek:WeatherStation:Dev_001",
    payload: JSON.stringify(unsubscription),


    idm_id : client_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
    idm_token : token_id,
    cap_token : null //this is always a JAVA object To see the content use .toString();

};


getCMResource(options, function(err, response){
    debug("Context Manager response: " + response);
});



















var actions = {
    registerContext : "REGISTER_CONTEXT",
    discoverContextAvailability : "DISCOVER_CONTEXT_AVAILABILITY",
    subscribeContextAvailability : "SUBSCRIBE_CONTEXT_AVAILABILITY",
    unsubscribeContextAvailability : "UNSUBSCRIBE_CONTEXT_AVAILABILITY",
    updateContextAvailabilitySubscription : "UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION",
    updateContext  : "UPDATE_CONTEXT",
    queryContext  : "QUERY_CONTEXT",
    subscribeContext : "SUBSCRIBE_CONTEXT",
    unsubscribeContext : "UNSUBSCRIBE_CONTEXT",
    updateContextSubscription : "UPDATE_CONTEXT_SUBSCRIPTION",
    createContextEntity : "CREATE_CONTEXT_ENTITY",
    deleteContextEntity : "DELETE_CONTEXT_ENTITY",
    //queryContext : "QUERY_CONTEXT_BY_ID"
};

//exports.requestToken = function(options, _cb){
function getCMResource(options, _cb){
    java.newInstance("org.umu.https.capabilityclient.HTTPSCapabilityClient", CERTS_FOLDER, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, function(err, cc){

        var NGSI_ACTION = java.getStaticFieldValue("org.umu.https.capabilityclient.NGSI_ACTION", actions[options.ngsi_action]);

        cc.ownToken(NGSI_ACTION, options.context_id, function(err, ct){

            if (ct == null || !ct.tokenIsValid()){

                debug("TOKEN Not valid....");
                debug("Requesting Capability token...");
                debug("client_id " + options.idm_id);
                debug("authToken " + options.idm_token);
                debug("NGSI_ACTION " + NGSI_ACTION);
                debug("options.context_id " + options.context_id);

                cc.requestCapabilityToken(
                    options.idm_id,
                    options.idm_token,
                    NGSI_ACTION,
                    options.context_id,
                    CAPABILITY_MANAGER_ADDRESS,

                    function(err, ctok){
                        debug("error : " + err);
                        debug("Capability token received: " + ctok.toString());
                        options.cap_token = ctok;
                        requestContextManager(options, _cb);
                    });

            }
            else {
                debug("TOKEN valid....");
                debug("error " + err);

                options.cap_token = ct;

                debug(options);

                requestContextManager(options, _cb);
            }
        });
    });

}

function requestContextManager(options, _cb) {
    java.newInstance("org.umu.https.contextmanager.client.HTTPSContextManagerClient", CERTS_FOLDER, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, function(err, httpsCMclient){

        console.log("Trying to get access to the Context Manager...");
        httpsCMclient.getAccess(
                options.cap_token,
                options.resource,
                options.payload,
                options.idm_id,
                options.idm_token,
                function(err, response){
                    _cb(err, response);
                });

        });
}

