var util = require('util');
var path = require("path");
var debug = require('debug')('controllers:capability');

var java = require("java");
var url = require('url');
var fs = require('fs');

var env = process.env.NODE_ENV || 'development';
var config = require('../../../../config/config')[env];

var libs_path = __dirname + '/../libs';
fs.readdirSync(libs_path).forEach(function (file) {
    if (~file.indexOf('.jar')) {
        java.classpath.push(path.resolve(__dirname + "/../libs/" + file));
    }
});


var CERTS_FOLDER = __dirname + "/certs_sociotal/";
var CAPABILITY_TOKENS_FOLDER = __dirname + "/capability_tokens/";

var KEYSTORE_FILE = "clientkeystore.p12";
var TRUSTEDCERTS = [ "ca.cer", "UniversidaddeCantabria.cer", "UC.crt" ];
var CERTAUTHENTICATION = true;
var USEDELEGATION = true;


var KEYSTORE_PASSWORD = config.capabilityManagerParams.keystore_password;
var CAPABILITY_MANAGER_ADDRESS = config.capabilityManagerParams.capability_manager_address;


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
    queryContextById : "QUERY_CONTEXT_BY_ID"
};


exports.getCMResource = function(options, _cb){
//function getCMResource(options, _cb){
    debug("getCMResource");
    debug("options.idm_token " + options.idm_token)
    if(options.idm_token === null || options.idm_token === undefined || options.idm_token === ""){
        debug("USER not authenticated");
        var err = {error: 401, message: "User not authenticated in Idm"};
        debug(err)
        _cb(err, null);
    } else {

        // var settings = java.newInstanceSync("org.umu.https.capabilityclient.Settings", KEYSTORE_FILE, CERTS_FOLDER, TRUSTEDCERTS, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, CERTAUTHENTICATION, USEDELEGATION);

        java.newInstance("org.umu.https.capabilityclient.Settings", KEYSTORE_FILE, CERTS_FOLDER, TRUSTEDCERTS, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, CERTAUTHENTICATION, USEDELEGATION, function(err, settings){

            java.newInstance("org.umu.https.capabilityclient.HTTPSCapabilityClient", settings, function(err, cc){

                var NGSI_ACTION = java.getStaticFieldValue("org.umu.https.contextmanager.client.NGSI_ACTION", actions[options.ngsi_action]);

                cc.ownToken(NGSI_ACTION, options.context_id, function(err, ct){
                    if (ct == null || !ct.tokenIsValid()){
                        debug("CAPABILITY TOKEN Not valid....");
                        debug("Requesting for a new Capability Token...");
                        debug("client_id " + options.idm_id);
                        debug("authToken " + options.idm_token);
                        debug("NGSI_ACTION " + NGSI_ACTION);
                        debug("context_id " + options.context_id);

                        cc.requestCapabilityToken(
                          options.idm_id,
                          options.idm_token,
                          NGSI_ACTION,
                          options.context_id,
                          CAPABILITY_MANAGER_ADDRESS,

                          function(err, ctok){
                              debug("ctok: " + ctok)
                              if(ctok === null || ctok === undefined){
                                  debug("ERROR: Capability token not generated!!")
                                  var err = {error: 401, message: "User not authenticated in Idm"};
                                  debug(err)
                                  _cb(err, null);
                              } else {
                                  debug("exports.getCMResource --- Capability token received: " + ctok);
                                  // options.cap_token = ctok;

                                  requestContextManager(ctok, options, _cb);
                              }
                          });

                    }
                    else {
                        debug("CAPABILITY TOKEN valid....");
                        debug("error " + err);
                        debug("ct valid " +  JSON.stringify(ct))

                        options.cap_token = ct;

                        requestContextManager(ct, options, _cb);
                    }
                });

            });

        });

    }
}

function requestContextManager(cap_token, options, _cb) {

    // var settings = java.newInstanceSync("org.umu.https.capabilityclient.Settings", KEYSTORE_FILE, CERTS_FOLDER, TRUSTEDCERTS, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, CERTAUTHENTICATION, USEDELEGATION);

    java.newInstance("org.umu.https.capabilityclient.Settings", KEYSTORE_FILE, CERTS_FOLDER, TRUSTEDCERTS, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, CERTAUTHENTICATION, USEDELEGATION, function(err, settings){

        //HTTPSContextManagerClient httpsCMclient = new HTTPSContextManagerClient(settings);

        debug("\n******************* comm_token in LIBRERIA: "+            options.community_token);
        debug("\n******************* typeof cap_token in LIBRERIA: "+typeof cap_token);

        java.newInstance("org.umu.https.contextmanager.client.HTTPSContextManagerClient", settings, function(err, httpsCMclient){

            debug("Trying to get access to the Context Manager...");
            httpsCMclient.getAccess(
              cap_token,
              options.resource,
              options.payload,
              options.idm_id,
              options.idm_token,
              options.community_token,
              function(err, _response){
                  var response;


                  try{
                      response = JSON.parse(_response);
                      // debug("requestContextManager -- requestContextManager response: " + JSON.stringify(response));
                      _cb(err, response);
                  }catch (exception) {
                      debug("exception parsing response");
                      _cb(err, {errorCode:401});
                  }

                  clearCapabilityFolder()
                  

                  // if (typeof response == 'string'){
                  //     response = JSON.parse(response);
                  // }
                  //
                  // debug("requestContextManager -- requestContextManager response: " + JSON.stringify(response));
                  // _cb(err, response);
                  // clearCapabilityFolder()
                  //


                  //if(res.errorCode !== undefined){
                  //    if(res.errorCode.code === "401")
                  //        _cb({token_not_valid: true}, null);
                  //    else
                  //        requestWithoutCapToken(options, _cb);
                  //}
              });

        });

    });


}


function clearCapabilityFolder(){
    fs.readdirSync(CAPABILITY_TOKENS_FOLDER).forEach(function (file) {
        if (~file.indexOf('.txt')) fs.unlink(CAPABILITY_TOKENS_FOLDER + '/' + file)
    })
}

exports.clearCapabilityFolder = clearCapabilityFolder;


exports.getCapabilityToken = function(options, _cb){

    java.newInstance("org.umu.https.capabilityclient.HTTPSCapabilityClient", CERTS_FOLDER, CAPABILITY_TOKENS_FOLDER, KEYSTORE_PASSWORD, function(err, CapabilityClient){
        var NGSI_ACTION = java.getStaticFieldValue("org.umu.https.capabilityclient.NGSI_ACTION", actions[options.ngsi_action]);

        CapabilityClient.requestCapabilityToken(
            options.idm_id,
            options.idm_token,
            NGSI_ACTION,
            options.context_id,
            CAPABILITY_MANAGER_ADDRESS,
            function(err, ctok){
                if(ctok !== null){
                    debug("getCapabilityToken --- Capability token received: " + JSON.stringify(ctok));
                    _cb(undefined, {capabilityToken: ctok});
                }
                else
                    _cb(500, {"Error" : "Check for a valid idm id and authorization token"});
            });

    });
};

