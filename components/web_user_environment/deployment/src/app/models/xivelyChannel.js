var debug = require('debug')('models:xivelyChannel');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel = require('./channel');
var utils = require('../../lib/utils');
//var sleep = require('sleep');
var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
//var ChannelSchema = channel.ChannelSchema;


var XivelyChannelSchema = ChannelSchema.extend({

  feedID:String,
  xivelyChannelID:String,
  apiKey: String,
  format: {type:String, default:"json"}

});


// info to show in connections part
XivelyChannelSchema.statics.triggerDictionary = [
  {id: "lowPassTrigger", label : "less than", default: 20, type: "" },
  {id: "highPassTrigger", label : "greater than", default: 40, type: "" }
];

XivelyChannelSchema.statics.actionDictionary = [
  {id: "action1", label : "make action1 ", default: 210, type: "" },
  {id: "action2", label : "make action2 ", default: 50, type: "" }
];

XivelyChannelSchema.methods.lowPassTrigger = function(conn, val, check){
      debug("executing lowPassTrigger");
      debug("check is "+check);

    if(conn.trigger.attribute == val.name && (parseFloat(val.value) <= check))
        return true;
    else
        return false;
};

XivelyChannelSchema.methods.highPassTrigger = function(conn, val, check){
      debug("executing highPassTrigger");
      debug("check is "+check);

    if(conn.trigger.attribute == val.name && (parseFloat(val.value) >= check))
        return true;
    else
        return false;
};




// il metodo taskRun sara' invocato dalla UI
XivelyChannelSchema.methods.taskRun = function(client_responce){
    debug("xively channel running");
    debug("connecting to xively and taking current value");

    var channel = this;
    this.apiCall(function (statusCode,result){
      debug("status:"+statusCode);
      debug("result:"+JSON.stringify(result));

      var resp = {success: true, data: result};
      client_responce.write(JSON.stringify(resp));
      client_responce.end();

     });
};


// il metodo runTriggers sara' invocato da uno scheduler
XivelyChannelSchema.methods.shotEvent = function(pubsubBroker, sockets){
    debug("xively channel running");
    debug("connecting to xively and taking current value");
    var self = this;

    this.apiCall(function (statusCode,result){
        debug("Xively.apiCall callback");
        debug("status code response :" + statusCode);
        debug("result response :" + JSON.stringify(result));

        if(statusCode===200){
            //self.runTriggers(result, pubsubBroker);
            debug("\nRun triggers in Xivelydata stream..." );
            var val = result;
            self.connections.forEach(function(conn){

                debug("Running Connection" );
                debug("Running Connection with val %s and triggers %s:",  JSON.stringify(val), JSON.stringify(conn.trigger));

                var triggerName = conn.trigger.name;
                var triggerCheck = conn.trigger.check;
                var triggerNegation = conn.trigger.negation;

                var Trigger = mongoose.model('TriggerSchema');
                var triggerResult = new Trigger().getTriggerFunction(triggerName)[0].callback(result.payload.value, triggerCheck, triggerNegation);

                debug("Trigger:");
                debug("\t name: " + triggerName);
                debug("\t nega: " + triggerNegation);
                debug("\t value: " + result.payload.value);
                debug("\t check: " + triggerCheck);
                debug("\t label: " + conn.label);
                debug("\t result: " + triggerResult);

                if(triggerResult){
                    debug("Trigger return true");
                    var event = {
                        channelId: conn.action.targetChannelId,
                        actionName: conn.action.actionName,
                        arg:conn.action.arg
                    };

                    var Channel = mongoose.model('Channel');
                    Channel.findOne({'_id': conn.action.targetChannelId}, function(err, channel){
                        switch (channel.channel_type){
                            case "PhoneChannel":
                                event.arg = {registration_id: channel.registration_id, message: conn.action.arg};
                                break;
                        }

                        pubsubBroker.publish(config.connectionPubSubTopic, event,
                            function(err) {
                                if(!err) debug('message published: '+ JSON.stringify(event) + "\n");
                                else debug(err);
                            }
                        );
                    });


                }

            });

            // am
            var resp = {success: true, data: result};
            debug("Send emit to client " + self.title + " "+ self._id);
            debug("namespace:  new-data-" + self._id);
            sockets.sockets.emit('new-data-' + self._id, resp);
        }
    });


};


// ES: {"version":"1.0.0","unit":{"label":"Byte","symbol":"B"},"tags":["Bytes written"],"min_value":"32768000.0","max_value":"27582819286016.0","at":"2014-04-30T08:52:38.907996Z","current_value":"7959642112000","id":"bw"}
XivelyChannelSchema.methods.prepareInboxData = function(obj){
    var data = {};

    data.request_type   = "read";
    data.data_type      = "current value";
    data.value          = utils.getFieldValue(obj, "current_value");
    data.date_created   = new Date();
    data.unit           = utils.getFieldValue(obj, "symbol");

    return data;
};



var http = require("http");
var https = require("https");


/**
 * apiCall:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
XivelyChannelSchema.methods.apiCall = function(onResult)
{
    var INBOX_LIMIT_MAX = 20;
    debug("xively::api call");

    // self is the "this" object. used to avoid the scope issues.
    self = this;
    var obj;
    var options = {
      host:"api.xively.com",
      port:443,
      path:'/v2/feeds/'+this.feedID+'/datastreams/'+this.xivelyChannelID+'?key='+this.apiKey,
      method:"GET",
      headers:{}
    };

    var req = https.request(options, function(res)
    {
        var output = '';
        debug(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            obj = JSON.parse(output);
            debug("respose feed: " + JSON.stringify(obj));
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

    req.end();
};


mongoose.model('XivelyChannel', XivelyChannelSchema);
module.exports = XivelyChannelSchema;
