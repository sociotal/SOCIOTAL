var debug = require('debug')('models:debugChannel');
var extend=require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel=require('./channel');
var DebugChannelSchema = ChannelSchema.extend({});


DebugChannelSchema.methods.logAction = function(arg){
    debug("**************************************");
    debug("executing logAction action");
    debug("arg is " + arg);
    debug("**************************************");

    var INBOX_LIMIT_MAX = 20;
    if( this.inbox.length >= INBOX_LIMIT_MAX)
        this.inbox.shift();

    var pay = {"request_type": "action", "data_type": "consoleAction", "date_created" : new Date(), "value": arg, "unit": ""};
    this.inbox.push(pay);
    this.save();

};


// il metodo runTriggers sara' invocato da uno scheduler
DebugChannelSchema.methods.shotEvent = function(pubsubBroker){
     this.runTriggers("", pubsubBroker);

};



DebugChannelSchema.statics.actionDictionary = [
  {id: "logAction", label : "log", default: "", type: "" }

];

mongoose.model('DebugChannel', DebugChannelSchema);
module.exports = DebugChannelSchema;
