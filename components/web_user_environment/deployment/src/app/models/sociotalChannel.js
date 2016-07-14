var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel = require('./channel');
var utils = require('../../lib/utils');
//var sleep = require('sleep');
var http = require("http");
var https = require("https");
var url = require('url');

var debug = require('debug')('models:SocIoTalChannel');


var config = require('../../config/config')[process.env.NODE_ENV || 'development'];
var cmEndpoint = config.contextManager[process.env.CM || 'v1Http'];

//var ChannelSchema = channel.ChannelSchema;

// Metadata data schema
var MetadataSchema = mongoose.Schema({
    //date_created: {type : String, default : ""},
    name: {type : String, default: ''},
    type: {type : String, default: ''},
    value: {type : String, default: ''}
});


// Sensors/Attributes data schema
var AttributeSchema = mongoose.Schema({
    name: {type : String, default: ''},
    type: {type : String, default: ''},
    value: {type : String, default: ''},
    metadatas: [MetadataSchema]
});


// inbox/outbox data schema
var SubscriptionSchema = mongoose.Schema({
    date_created: {type : String, default : ""},
    title: {type : String, default : ""},
    duration: {type : String, default : ""},
    subscriptionId: {type : String, default : ""}
});



var SociotalChannelSchema = ChannelSchema.extend({
  //sociotalChannelId: String,   // this is the DEVICE not the channel
  //deviceType: String,
  contextId: String,   // this is the DEVICE not the channel
  contextType: String,
  contextCommunity: String,
  attributes: [AttributeSchema],
  subscriptions: [SubscriptionSchema]
});


var parsedServerURL = url.parse(cmEndpoint);


var UCSERVER = {    protocol: parsedServerURL.protocol + "//",
                    host: parsedServerURL.hostname,
                    port : parsedServerURL.port,
                    basepath_NGSI10 : parsedServerURL.pathname + "/NGSI10_API",
                    basepath_NGSI09 : parsedServerURL.pathname + "/NGSI9_API"
                };



// info to show in connections part
 SociotalChannelSchema.statics.triggerDictionary = [
  {id: "lowPassTrigger", label : "less than ", default: 20, type: "" },
  {id: "highPassTrigger", label : "greater than ", default: 40, type: "" }
];

 SociotalChannelSchema.statics.actionDictionary = [
  {id: "action1", label : "make action1 ", default: 210, type: "" },
  {id: "action2", label : "make action2 ", default: 50, type: "" }
];

 SociotalChannelSchema.methods.lowPassTrigger = function(conn, val, check){
      debug("executing lowPassTrigger");
      debug("check is "+check);
      debug("current_value is: ");
      //debug(val);
      debug(parseFloat(val.value));
      //debug(parseFloat(val.value));
      if(conn.trigger.attribute == val.name && (parseFloat(val.value) <= check))
        return true;
      else
        return false;
};

 SociotalChannelSchema.methods.highPassTrigger = function(conn, val, check){
      debug("executing highPassTrigger");
      debug("check is "+check);
      debug("current_value is: ");
      //debug(val);
      //debug(conn);
      //debug(conn.trigger.attribute);
      //debug(val.name);
      debug(parseFloat(val.value));
      debug(check);

      if(conn.trigger.attribute == val.name && (parseFloat(val.value) >= check))
         return true;
      else
         return false;
};


 /*

// il metodo taskRun sara' invocato dalla UI
 SociotalChannelSchema.methods.taskRun = function(client_responce){
    debug("xively channel running");
    debug("connecting to xively and taking current value");

    //sleep.sleep(2);
    //debug("Risposta di xively oookkkk");
    //var resp = {success: true, data: "ejaaaa risposta giusta di xiveli"};
    //client_responce.send(JSON.stringify(resp));

    var channel = this;
    this.apiCall(function (statusCode,result){
      debug("status:"+statusCode);
      debug("result:"+JSON.stringify(result));

      var resp = {success: true, data: result}
      client_responce.write(JSON.stringify(resp));
      client_responce.end();

     });
};
*/

// il metodo runTriggers sara' invocato da uno scheduler
 SociotalChannelSchema.methods.shotEvent = function(pubsubBroker, sockets){
    debug("SCB channel running");
    debug("connecting to SCB and taking current value");
    var self = this;

    this.apiCall(function (statusCode,result){
        debug("SCB.apiCall callback");
        debug("status code response :" + statusCode);


        if(statusCode===200){
            self.runTriggers(result, pubsubBroker);

            // am
            var resp = {success: true, data: result};
            debug("Send emit to client " + self.title + " "+ self._id);
            debug("namespace:  new-data-" + self._id);
            sockets.sockets.emit('new-data-' + self._id, resp);
        }

    });


};

/*
 */
 SociotalChannelSchema.methods.prepareInboxData = function(response){
 /*    {
         "_id" : ObjectId("5448d88690e65b7404eeba9d"),
         "unit" : "B",
         "value" : "15523250176000",
         "data_type" : "current value",
         "request_type" : "read",
         "date_created" : "2014-08-31T16:42:02.714278Z"
     },
*/
     var data = {};
     var obj = response.contextResponses[0].contextElement.attributes[0];
    data.request_type   = obj.name;
    data.data_type      = obj.type;
    data.value          = obj.value;
    data.date_created   = new Date();
    //data.unit           = obj.unit.symbol;

    return data;
};




// * apiCall:  REST get request returning JSON object(s)
// * @param options: http options object
// * @param callback: callback to pass the results JSON object(s) back

// ********************************************************** //
//                          POLLING                           //
// ********************************************************** //
SociotalChannelSchema.methods.apiCall = function(onResult)
{
    var INBOX_LIMIT_MAX = 20;
    debug("Sociotal Weather Station ");

    var capability_token = createCapabilityToken(_url);
    debug(capability_token);

    // self is the "this" object. used to avoid the scope issues.
    // http://193.144.201.50:3500/SocIoTal_Context_UC_REST/NGSI10_API/queryContext/SocIoTal:SAN:WeatherStation:Dev_001
    self = this;

    var post_data = JSON.stringify({"entities":[
                        {"type":"", "isPattern":"false", "id":"SocIoTal:SAN:WeatherStation:Dev_001"} ],
                     "attributes":["Temperatura"]});


    debug("post_data " + post_data);

    var obj;
    var options = {
      host: UCSERVER.host,
      port: UCSERVER.port,
      path: UCSERVER.basepath_NGSI10 + "/queryContext?limit=1",
      method:   "POST",
      headers:{"Content-Type": "application/json", "Accept": "application/json" ,"Capability-token": capability_token},


    };

    var req = http.request(options, function(res)
    {
        var output = '';
        debug(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            obj = JSON.parse(output);
           // debug("respose feed: " + JSON.stringify(obj));
            var time = new Date();

            if( self.inbox.length >= INBOX_LIMIT_MAX)
                self.inbox.shift();

            var pay = self.prepareInboxData(obj);
            self.inbox.push(pay);    // save new data inside inbox
            self.save();             // save inside db

            onResult(res.statusCode, {date_created: time, payload: pay});
        });

    });

    req.on('error', function(err) {
        debug(options.host + ':' + err);
    });
    // post the data
    req.write(post_data);
    req.end();
};


// get Context Attributes with query on ngsi10 with payload
SociotalChannelSchema.methods.getContextAttributesWithQueryAndPayload = function(sociotalId, onResult)
{
    debug("getContextAttributes NGSI10 query and payload");

    var data =  {"entities": [{"type": "", "isPattern": "false", "id": sociotalId}], "attributes":"*"};

    var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext?limit=1";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(data);

    http_post(url, data, onResult);
};


// get Context Attributes with query on ngsi10
SociotalChannelSchema.methods.queryContext = function(sociotalId, onResult)
{
    debug("getContextAttributes NGSI10 query and payload");

    var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext/"+sociotalId;
    debug("the url is: " + url);

    http_get(url, onResult);
};

var capability = require("../controllers/security-manager/capability/capabilityV3.js");
var communities = require("../controllers/communities.js");









SociotalChannelSchema.methods.queryContextWithJSONPayload = function(req, data, onResult)
{
  debug("Context Manager discoverContextAvailability");
  debug("data.entities[0]: "+ JSON.stringify(data.entities[0]));
  debug("req.params.community_name " + req.body.communityName);
  debug("req.params " + JSON.stringify(req.body));


  communities.getCommunityToken(req.user.idm_token, req.body.communityName, "default", function(error, communityToken) {

    if (error || req.body.communityName == "0C" || req.body.communityName == undefined) {
      communityToken = null
    }

    debug("Context Manager queryContextWithJSONPayload");
    debug("community_token " + communityToken);
    debug("idm_token UUID " + req.user.idm_token);

    var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";
    debug("the url issssssss: " + url);
    debug("data to send: ");
    debug(data);

    debug("chiamata alla post");

    //http_post(url, data, onResult);

    var options = {

      resource: url,
      ngsi_action: "queryContext",
      context_id: data.entities[0].id,
      payload: JSON.stringify(data),
      community_token: communityToken,
      idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
      idm_token: req.user.idm_token,
      cap_token: null //this is always a JAVA object To see the content use .toString();

    };
    debug(options);


    capability.getCMResource(options, onResult)

  });
};
















function http_post(_url, _data, _cb){
    var obj;

    var capability_token = createCapabilityToken(_url);
    debug(capability_token);

    var options = {
        host: url.parse(_url).hostname,
        port: url.parse(_url).port,
        path: url.parse(_url).path,
        method:   "POST",

        headers:{"Content-Type": "application/json", "Accept": "application/json" ,"Capability-token": capability_token},
        rejectUnauthorized: false //for auto-generated certificates

    };






    var protocol = url.parse(_url).protocol;
    debug('Protocol IS: ', protocol);

    if(protocol === 'http:'){
          var req = http.request(options, function(res)
          {
              var output = '';
              res.setEncoding('utf8');

              res.on('data', function (chunk) {
                  output += chunk;
              });

              res.on('end', function() {
                  obj = JSON.parse(output);
                  _cb(res.statusCode, obj);
              });

          });

          req.on('error', function(err) {
              _cb(505, err);
          });
          // post the data
          req.write(JSON.stringify(_data));
          req.end();
    } else {

        var req = https.request(options, function(res)
        {
            var output = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function() {
                obj = JSON.parse(output);
                _cb(res.statusCode, obj);
            });

        });

        req.on('error', function(err) {
            _cb(505, err);
        });
        // post the data
        req.write(JSON.stringify(_data));
        req.end();

    }

}


function http_get(_url, _cb){
    var obj;

    var capability_token = createCapabilityToken(_url);
    debug(capability_token);

    var options = {
        host: url.parse(_url).hostname,
        port: url.parse(_url).port,
        path: url.parse(_url).path,
        method:   "GET",
        headers:{"Content-Type": "application/json", "Accept": "application/json" ,"Capability-token": capability_token},

    };

    var req = http.request(options, function(res)
    {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            obj = JSON.parse(output);
            _cb(res.statusCode, obj);
        });

    });

    req.on('error', function(err) {
        _cb(505, err);
    });
    req.end();


}


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
  });

  return result;

}


mongoose.model('SocIoTalChannel', SociotalChannelSchema);
module.exports = SociotalChannelSchema;
