var debug = require('debug')('models:smartphoneChannel');
var extend=require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel=require('./channel');
var GCM = require('gcm').GCM;


var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

var PhoneChannelSchema = ChannelSchema.extend({
    registration_id:  {type : String, default: ''}
});

PhoneChannelSchema.methods.sendNotification = function(arg, cb ){
    debug("**************************************");
    debug("executing sendNotification action");
    debug("arg is " + JSON.stringify(arg));
    debug("**************************************");

    var gcm = new GCM(config.GCM_APIKEY);

    var message = {
        registration_id: arg.registration_id, // required
        collapse_key: 'Collapse key',
        delay_while_idle: true
        //'data.key2': 'value2'
    };
    var obj = this;
    message['data.text'] = arg.message;

    gcm.send(message, function(err, messageId){
        if (err) {
            var message = "Something has gone wrong while sending notification!";
            debug();
            debug(err);
            if(cb !== undefined)
                cb({sent: false, message: err});
        } else {
            debug("Sent with message ID: ", messageId);
            var pay = {"request_type": "action", "data_type": "sendNotification", "date_created" : new Date(), "value": arg.message};
            obj.inbox.push(pay);     // save new data inside inbox
            obj.save();
            if(cb !== undefined)
                cb({sent: true});
        }
    });
};


PhoneChannelSchema.statics.actionDictionary = [
  {id: "sendNotification", label : "send notification", default: "", type: "" },
];

mongoose.model('PhoneChannel', PhoneChannelSchema);
module.exports = PhoneChannelSchema;
