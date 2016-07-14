var debug = require('debug')('models:CommunityMailChannel');
var extend=require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel=require('./channel');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var url = require('url');
var request = require('request');

var env = process.env.NODE_ENV || 'development';
var config = require('../../../sociotal/config/config')[env];
var cmEndpoint = config.contextManager[process.env.CM || 'v1Http'];
var util = require('util');

var async = require('async');

var parsedServerURL = url.parse(cmEndpoint);
// var users = require("../controllers/users.js");  // to get owner info


var UCSERVER = {    protocol: parsedServerURL.protocol + "//",
    host: parsedServerURL.hostname,
    port : parsedServerURL.port,
    basepath_COMM_V1 :  "/SocIoTal_COMM_V1"
};

var CommunityMailChannel = ChannelSchema.extend({
    community_name : String,
    community_id : String,
    community_token : String,
    user_idm_token: String,
});

CommunityMailChannel.methods.emailAction = function(message){
    debug("**************************************");
    debug("executing emailAction action for community: "+this.community_name);
    debug("message is " + message);
    debug("**************************************");
    debug("CommunityMailChannel running");
    debug("connecting to CommunityMailChannel and taking current value");
    var self = this;

    this.sendToMailingList(message, function (error, result){
        if (error){
            debug("ERROR " + error);
        } else {
            debug("success " + result);
        }
    });

    var INBOX_LIMIT_MAX = 20;
    if( this.inbox.length >= INBOX_LIMIT_MAX)
        this.inbox.shift();

    var pay = {"request_type": "action", "data_type": "emailAction", "date_created" : new Date(), "value": message, "unit": ""};
    this.inbox.push(pay);
    this.save();
};



CommunityMailChannel.methods.sendToMailingList = function (message, cb) {
    var self = this;
    this.getMembers(function (error, members) {
        if (!error) {
            debug("SENDING EMAIL TO: " + JSON.stringify(members));

            async.each(members,
                function (member, callback) {
                    var transporter = nodemailer.createTransport(smtpTransport(config.smtpTransportOptions));
                    var mailOptions = {
                        to: member.user.email,
                        from: 'SocIoTal Web User Environment <sociotal-team@crs4.it>',
                        subject: 'SocIoTal Community Email Alert',
                        text: 'Hi ' + member.user.userName+', \n' +
                        'there is an alert from the community \"'+self.community_name+'\". The message is: \n\n\"'+ message + '\"'
                    };
                    transporter.sendMail(mailOptions, function (err, result) {
                        debug("inside transporter ");
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, "email inviata");
                        }
                    });
                    callback();
                },
                function (err) {
                   cb(null, "Tutte le email inviate");
                }
              );

        } else {
            cb(error);
        }
    });
};

// var User = mongoose.model('User');

CommunityMailChannel.methods.getMembers= function (cb) {

    // UPDATE USER IDM TOKEN CON INTERROGAZIONE A DB (trovare idm token dello user di questo channel e riassegnarlo)
// cancellare user_idm_token da DB del channel mai  l


    // users.getUser("5720ba036f77f00b33745727", function(user){
    //
    //     debug("user is: "+JSON.stringify(user));
    // });

    // User.findOne({_id: this.user}, function(err, userOwner) {
    //     if(userOwner) {
    //         idm_token = userOwner.idm_token;
    //         debug("USER FOUND: "+ JSON.stringify(userOwner));
    //         debug("idm_token from DB is: "+ idm_token);
            this.getCommunityToken(this.user_idm_token, this.community_name, "default", function(error, communityToken) {
                if (error || this.community_name == "0C") {
                    communityToken = null
                }

                debug("Context Manager deleteContext");
                debug("community_token " + communityToken);
                debug("idm_token UUID " + this.user_idm_token);
                debug("req.query.community_name " + this.community_name);


                var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/listUsers";
                var options = {
                    url: url,
                    method: 'GET',
                    headers: {
                        "Community-Token": communityToken, // not work with idm_token Must be a valid community-token
                        "Content-Type": 'application/json',
                        "Accept-Type": 'application/json'
                    }
                };

                debug("url is: " + url);
                debug("options to send : ");
                debug(options);

                request(options, function (error, response, body) {
                    var members = JSON.parse(body).Users;
                    if (!error) {
                        cb(null, members);
                    } else {
                        debug("error in getMembers: " + JSON.stringify(error))
                        cb(error, []);
                    }
                });
            });


        // }else {
        //     cb(error, []);
        // }
    // });


};



CommunityMailChannel.methods.getCommunityToken = function(idm_token, community_name, domain_name, cb) {

    var domain_name = "Default";
    var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/TOKEN/request";


    var body = {
        "tokenUUID": idm_token,
        "communityName": community_name,
        "domainName": domain_name
    };

    var options = {
        url: url,
        body: JSON.stringify(body),
        headers: {"Content-Type": "application/json", "Accept": "application/json"}
    };

    request.post(options, function (error, response, body) {
        debug("response.status " + response.statusCode);


        if (error || response.statusCode == '404') {
            debug("getCommunityToken error " + error);
            cb("getCommunityToken error " + error, null);
        } else {

            debug("getCommunityToken body: " + body);

            if (typeof body == 'string') {
                body = JSON.parse(body);
            }

            debug("getCommunityToken headers " + util.inspect(response.headers));
            debug("communityToken  " + body.communityToken);
            debug("typeof body  " + typeof body);

            var commToken = body.communityToken;

            cb(null, commToken);
        }
    });

};



CommunityMailChannel.statics.actionDictionary = [
  {id: "emailAction", label : "Send email to community members", default: "Hi, this email to inform you that ", type: "" }

];


mongoose.model('CommunityMailChannel', CommunityMailChannel);
module.exports = CommunityMailChannel;
