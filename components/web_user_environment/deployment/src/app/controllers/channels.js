var debug = require('debug')('controllers:channels');


/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');
var Context = mongoose.model('ContextSchema');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var app = require('../../server');
var url = require('url');
var anomalydetector = require('./anomaly-detector/anomalyDetectorImplementation');
var expressValidator = require('express-validator');
var async = require('async');
var communities = require("./communities.js");  // to get owner info

var lodash = require('lodash');

var node_util = require('util');

var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

var trainset_size = 50; // avoid true_negatives on early data. To calculate anomaly only if trainset lengths are == trainset_size

var HIDDEN_PARAMS = ["owner", "update"];  // attributi da nascondere nella tabella dei dati del channel

/**
 * Load
 */
// this function is called only when the :id parameter is in the URL
exports.load = function (req, res, next, id) {
    var User = mongoose.model('User');
    if (req.path.indexOf('/api/') > -1 && id === undefined)
        id = req.body.channel_id;

    debug("loading channel id: " + id);
    var criteria = {_id: id};
    if (req.user !== undefined)
        criteria.user = req.user._id;

    Channel.load(criteria, function (err, channel) {
        debug("channel loaded: ")
        debug(channel);
        if (!channel) {
            if (req.path.indexOf('/api/') > -1) {
                res.send({status: 404, message: "Channel not found!"}, 404);
                return;
            } else
                return next(new Error('not found'));
        }
        req.channel = channel;
        next();
    });
};

/**
 * List
 */

exports.index = function (req, res) {
    debug(req.body);
    debug('query params: ' + req.query.type);
    var current_user = req.user._id;

    if (req.query.type !== undefined && req.query.type === 'smartphone') {
        debug('YES, returning SMARTPHONES');
        Channel.find({user: current_user, channel_type: 'PhoneChannel'}, function (err, phones) {
            if (err) return res.send(err, 500);
            if (req.path.indexOf('/api/') > -1) {
                var new_channels = renameId(phones);
                for (var i = 0; i < phones.length; i++) {
                    new_channels[i].user = {
                        "id": phones[i].user._id,
                        "username": phones[i].user.username,
                        "name": phones[i].user.name
                    };
                }
                res.send({channels: new_channels}, 200);
            } else {
                return res.render('channels/smartphones/index', {
                    title: 'Smartphones',
                    phones: phones
                });
            }
        });

    } else {

        Channel.find({user: current_user, channel_type: {$ne: "PhoneChannel"}}, function (err, channels) {
            if (err) return res.send(err, 500);
            if (req.path.indexOf('/api/') > -1) {
                var new_channels = renameId(channels);
                for (var i = 0; i < channels.length; i++) {
                    new_channels[i].user = {
                        "id": channels[i].user._id,
                        "username": channels[i].user.username,
                        "name": channels[i].user.name
                    };
                }
                res.send({channels: new_channels}, 200);
            } else {
                return res.render('channels/index', {
                    title: 'Channels',
                    channels: channels
                });
            }
        });

    }

};


exports.getMobChannels = function (req, res) {
    debug(req.body);
    var current_user = req.user._id;

    Channel.find({user: current_user}, function (err, phones) {
        if (err) return res.send(err, 500);
        if (req.path.indexOf('/api/') > -1) {
            var channels = renameId(phones);
            for (var i = 0; i < phones.length; i++) {
                channels[i].user = {
                    "id": phones[i].user._id,
                    "username": phones[i].user.username,
                    "name": phones[i].user.name
                };
            }
            res.send({channels: channels}, 200);
        }
    });
};


/**
 * List channels
 */

exports.listChannels = function (req, res) {
    debug("req.path: " + req.path);

    if (req.path.indexOf('/api/') > -1)
        debug("req.path: " + req.path.indexOf('/api/'));


    if (req.isAuthenticated()) {
        var current_user = req.user._id;

        Channel.find({user: current_user}, function (err, channels) {
            if (err) return res.send(err, 500);
            if (!channels || channels.length < 1) return res.send("No channel with this id exists!", 404);

            debug("channels find: " + channels.length);
            res.send({channels: channels}, 200);

        });
    }
};


/**
 * New channel
 */

exports.new = function (req, res) {

    debug("function new");
    res.render('channels/new', {
        title: 'New Channel',
        channel: new Channel({}),
        channelTypes: config.channelTypes

    });
};


// /**
//  * New channel
//  */

exports.form = function (req, res) {
    var channel_type = req.params.type;   // the channel type: xively or other
    debug("selected_type is ", channel_type);
    var ChannelConstr = mongoose.model(channel_type);
    var channel = new ChannelConstr(req.body);

    var options = {
        title: 'New Channel',
        channel: channel,
        params: req.query,
        channel_type: channel_type,
    };

    var form_file = "";
    config.channelsJadeTemplates.forEach(function (template) {
        if (template.type == channel_type) {
            form_file = template.form;
        }
    });
    debug("form_file ", form_file);

    res.render('channels/' + form_file, options);
};


/**
 * Create an channel
 */

//exports.create = function (req, res) {
//
//    debug("Create new channel");
//    debug(req.body);
//
//    var channelType=req.body.channel_type;
//    var ChannelConstr=mongoose.model(channelType);
//
//    var channel = new ChannelConstr(req.body);
//    channel.user = req.user;
//
//    debug("create function");
//
//    // This is necessary to have attributes list to compose connections
//    if(channelType == "SocIoTalChannel"){
//        var sociotalId = "SocIoTal:SAN:WeatherStation:Dev_001";
//        var data =  {"entities": [{"type": "", "isPattern": "true", "id": sociotalId }]}; /*req.body.contextId*/
//        channel.discoveryContext(data, function(statusCode, result){
//            debug("result data:" + JSON.stringify(data));
//            channel.attributes = result.contextResponses[0].contextElement.attributes;
//            channel.save();
//        })
//    }
//
//
//
//
//    channel.save();
//
//    req.flash('success', 'Successfully created channel!');
//
//    if(req.path.indexOf('/api/') > -1)
//        res.send(channel);
//    else
//        res.redirect('/channels/'+channel._id)
//
//};

exports.sendNotification = function (req, res) {

    debug("Sending new notification");
    var data = {registration_id: req.channel.registration_id, message: req.body.message};
    req.channel.sendNotification(data, function (response) {
        res.send(response);
    });

};


/**
 * Create an channel
 */

exports.createChannel = function (req, res) {

    debug("in createChannel");
    var channelType = req.body.channel_type;
    /*************************** VALIDATION *********************************/
    req.checkBody('channel_type', 'channel_type field is required').notEmpty();
    req.checkBody('title', 'title field is required').notEmpty();
    if (channelType == "SocIoTalChannel")
        req.checkBody('sociotal_id', 'sociotal_id field is required').notEmpty();

    if (channelType == "PhoneChannel")
        req.checkBody('registration_id', 'registration_id field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        var err_msg = 'There have been validation errors: ';
        for (var i = 0; i < errors.length; i++)
            err_msg += errors[i].msg + "; ";

        res.send({"status": 400, "message": err_msg}, 400);
        return;
    }
    /*************************** END VALIDATION ******************************/

    var channelBody = req.body;
    var ChannelConstr = mongoose.model(channelType);
    var channel = new ChannelConstr(channelBody);

    if (channelType == "CommunityMailChannel") {
        var comm = channelBody.community.split(":");
        var commName = comm[0];
        var commId = comm[1];
        channel.community_name = commName;
        channel.community_id = commId;
        channel.user_idm_token = req.user.idm_token;


        communities.getCommunityToken(req.user.idm_token, commName, "default", function (error, communityToken) {

            if (error || req.query.community_name === "0C") {
                communityToken = null
                debug("\n\n\n community token is: " + communityToken);

            } else {
                debug("\n\n\n community token is: " + communityToken);
                channel.community_token = communityToken;
                channel.save();
            }


        });

    }


    channel.user = req.user;
    var image = (typeof req.files != 'undefined') ? req.files.image : "";
    if (channelType == "SocIoTalChannel") {
        channel.contextId = req.body.sociotal_id;
        channel.contextCommunity = req.body.communityName;
        var data = {"entities": [{"type": "", "isPattern": "true", "id": channel.contextId}]};

        channel.queryContextWithJSONPayload(req, data, function (status, result) {

            if (result.contextResponses && result.contextResponses.length > 0) {
                var attributes = result.contextResponses[0].contextElement.attributes;
                channel.contextType = result.contextResponses[0].contextElement.type;
                channel.attributes = attributes;

                channel.save(function (err) {
                    req.flash('success', 'Successfully created channel!');
                    debug("Successfully created channel! ");

                    if (!err) {
                        if (req.path.indexOf('/api/') > -1)
                            return res.send(channel, 201);
                        else
                            return res.redirect('/channels/' + channel._id);
                    } else {
                        debug("err ", err);
                        return res.send({"error": 500, "message": "Cannot create sociotal channel " + err}, 500);
                    }
                });
            } else {
                res.send({"error": 400, "message": "Context Manager response not found"}, 400);
            }
        });
    }
    else {
        channel.save(function (err) {
            req.flash('success', 'Successfully created channel!');

            if (!err) {
                if (req.path.indexOf('/api/') > -1)
                    return res.send(channel, 201);
                else {
                    console.log("channel created redirecting");
                    return res.redirect('/channels/' + channel._id);
                }
            }
        });
    }
};

/**
 * Save a connection
 */

exports.saveConnection = function (req, res) {
    debug("Save new connection for channel: " + req.channel.title);
    if (!req.channel) {
        debug("error while saving connection: ");
        res.send({result: "failed"});
    }

    switch (req.body.mode) {
        case "new":
            req.channel.addConnection(req.body.connection);
            debug("Saved new connection! ");

            break;
        case "update":
            req.channel.removeConnection(req.body.connectionId);
            req.channel.addConnection(req.body.connection);

            debug("Connection updated! ");
            break;
    }
    req.channel.save();
    res.send({result: "success", channelId: req.channel._id});

};


/**
 * list all connections for a channel
 */

exports.listConnections = function (req, res) {
    debug("List connections request");

    // var ChannelConstr = mongoose.model(req.channel.channel_type);
    //
    // ChannelConstr.findOne(
    //     {_id : req.channel._id}, {inbox:0, outbox: 0, attributes: 0},

    // function callback (err, channel) {
    //   if(err){
    //     debug("error while listing connections: " + err);
    //     res.send({success:false});
    //   } else
    var channel = req.channel;
    debug("Success connections list");
    debug("List sent!");

    var connections = channel.connections;
    async.each(connections, function (connection, done) {
        Channel.findOne({_id: connection.action.targetChannelId}, function (err, targChannel) {
            if (targChannel) {
                connection.action.targetChannelName = targChannel.title;
                debug("Connection: " + connection.action.targetChannelName);
                done();
            } else {
                done();
            }
        });

    }, function (err) {
        if (err) console.log(err);
        channel.connections = connections;
        res.send({success: true, data: channel.connections});
    });


    //    }
    //);
};

/**
 * Delete a connection
 */

exports.deleteConnection = function (req, res) {

    debug("Delete connection for channel: " + req.channel.title);
    if (!req.channel) {
        debug("error while deleting connection: ");
        res.send({result: "failed"});
    }

    req.channel.removeConnection(req.params.connId);
    req.channel.save();

    debug("Connection deleted! ");
    res.send({result: "success", channelId: req.channel._id});

};


/**
 * Add a composition
 */
exports.createComposition = function (req, res) {
    /*************************** VALIDATION *********************************/
    req.checkBody('trigger', 'trigger field is required').notEmpty();
    req.checkBody('action', 'action field is required').notEmpty();
    req.checkBody('label', 'label field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        var err_msg = 'There have been validation errors: ';
        for (var i = 0; i < errors.length; i++)
            err_msg += errors[i].msg + "; ";
        res.send({"status": 400, "message": err_msg}, 400);
        return;
    }
    /*************************** END VALIDATION ******************************/


    req.channel.connections.push(req.body);
    req.channel.save();
    debug("composition added");

    res.send({compositions: renameId(req.channel.connections)}, 201);
};

/**
 * Update a composition
 */
exports.updateComposition = function (req, res) {
    debug("Update composition");
    /*************************** VALIDATION *********************************/
    req.checkBody('trigger', 'trigger field is required').notEmpty();
    req.checkBody('action', 'action field is required').notEmpty();
    req.checkBody('label', 'label field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        var err_msg = 'There have been validation errors: ';
        for (var i = 0; i < errors.length; i++)
            err_msg += errors[i].msg + "; ";
        res.send({"status": 400, "message": err_msg}, 400);
        return;
    }
    /*************************** END VALIDATION ******************************/
    var composition_id = req.param('compid');
    if (composition_id !== undefined) {

        var compos = req.channel.connections.filter(function (item) {
            return (item._id == composition_id);
        });

        if (compos.length === 0)
            res.send({"status": 404, "message": "composition not found!"}, 404);
        else {
            var composition = compos[0];
            composition.trigger = req.body.trigger;
            composition.action = req.body.action;
            composition.label = req.body.label;

            req.channel.save();
            debug("composition updated!!");
            res.send({composition: renameId(composition)}, 200);
        }
    }

};

function renameId(obj) {
    var result = null;
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        result = Array();
        for (var i = 0; i < obj.length; i++) {
            var tmp = JSON.parse(JSON.stringify(obj[i]));
            tmp.id = tmp._id;
            delete tmp._id;
            result[i] = tmp;
        }
    } else {
        var tmp = JSON.parse(JSON.stringify(obj));
        tmp.id = tmp._id;
        delete tmp._id;
        result = tmp;
    }
    return result;
}
/**
 * Get a composition
 */
exports.getComposition = function (req, res) {
    debug("Get a composition");
    var composition_id = req.param('compid');
    debug("composition_id: " + composition_id);

    if (composition_id !== undefined) {
        var compositions = req.channel.connections.filter(function (item) {
            if (item._id == composition_id)
                return item;

        });
        if (compositions.length > 0)
            res.send({composition: renameId(compositions[0])}, 200);
        else
            res.send({status: 404, composition: "Not found!"}, 404);

    } else { // LIST ALL COMPOSITIONS
        res.send({compositions: renameId(req.channel.connections)}, 200);
    }
};

/**
 * Delete a composition
 */
exports.deleteComposition = function (req, res) {
    debug("delete a composition");
    var composition_id = req.param('compid');
    if (typeof composition_id !== 'undefined') {
        var compos = req.channel.connections.filter(function (item) {
            return (item._id == composition_id);
        });
        if (compos.length === 0)
            res.send({"status": 404, "message": "composition not found!"}, 404);
        else {
            var index = req.channel.connections.indexOf(compos[0]);
            req.channel.connections.splice(index, 1);
            req.channel.save();
            res.send(200);

        }

    }
};

/**
 * Edit a channel
 */

exports.edit = function (req, res) {
    debug(req.channel);
    var channel_type = req.channel.channel_type;
    var current_form = 'empty';

    switch (channel_type) {
        case "XivelyChannel":
            current_form = 'channels/forms/xively';
            break;
        case "SocIoTalChannel":
            current_form = 'channels/forms/sociotal';
            break;
        case "DebugChannel":
            current_form = 'channels/forms/debug';
            break;
        case "GenericDeviceChannel":
            current_form = 'channels/forms/generic';
            break;
        case "PhoneChannel":
            current_form = 'channels/forms/phone';
            break;
        case "CommunityMailChannel":
            current_form = 'channels/forms/mail';
            break;

        default:
            res.status(500).send();
            break;
    }

    res.render(current_form, {
        title: 'Edit ' + req.channel.title,
        channel: req.channel,
        channel_type: req.channel.channel_type,
        params: req.query
    });
};


/**
 * get channel data stored in database with params: limit to get the last n values, and skip to skip first n values
 */
exports.getData = function (req, res) {
    debug("get channel Data");
    var limit = parseInt(req.param('limit'));
    var skip = parseInt(req.param('skip'));


    if (req.isAuthenticated()) {
        var ChannelConstr = mongoose.model(req.channel.channel_type);
        ChannelConstr.findOne(
            {_id: req.channel._id},
            function callback(err, channel) {
                if (err) {
                    debug("error while listing data: " + err);
                    res.send({success: false});
                } else {
                    var channel = renameId(channel); // clone the object
                    channel.user = {
                        "id": req.channel.user._id,
                        "username": req.channel.user.username,
                        "name": req.channel.user.name
                    };
                    var inbox = channel.inbox;
                    if (inbox) {
                        inbox.sort(function (a, b) {
                            var dateA = new Date(a.date_created);
                            var dateB = new Date(b.date_created);
                            return dateB - dateA;
                        });
                    }
                    var count = inbox.length;
                    if (!limit) limit = count;
                    if (!skip) skip = 0;
                    res.send({
                        "results": inbox.slice(skip, limit + skip),
                        "_metadata": {"totalCount": count, "limit": limit, "skip": skip}
                    });
                }
            }
        );
    }

};


/**
 * get specific channel
 */
exports.get = function (req, res) {
    debug("get channel");
    if (req.isAuthenticated()) {
        var channel = renameId(req.channel); // clone the object
        channel.user = {
            "id": req.channel.user._id,
            "username": req.channel.user.username,
            "name": req.channel.user.name
        };
        res.send({channel: channel});
    }
};

var context = require('./contextV3');

exports.subscribeChannel = function (req, res) {
    debug('\n New subscription channel');
    req.body.channel_id = req.channel._id;

    req.body.hostname = req.host;
    context.subscribe(req, req.body, function (statusCode, result) {

        debug("Context Manager subscription callback");
        debug("status code response : " + statusCode);

        // if UCBrocker is not up return false
        if (result.error !== 'undefined' && result.error == 404) return res.send({
            success: false,
            message: "Sorry! ContextBroker not available"
        });

        debug("response body: " + JSON.stringify(result));
        if (result.subscribeResponse !== undefined) {

            var channel = req.channel;
            var subscription = {
                date_created: new Date(),
                title: req.body.attribute,
                subscriptionId: result.subscribeResponse.subscriptionId
            };

            channel.subscriptions = subscription;
            req.channel.subscribed = true;
            channel.save();

            if (req.body.easy) // easy mode. The user can't change parameters
                res.send({success: true, subscriptionId: result.subscribeResponse.subscriptionId});
            else
                res.send({success: true, channelId: req.channel._id});
        } else {
            debug("SUBSCRIPTION ERROR. RESULT IS: " + JSON.stringify(result)) // result.subscribeError.errorCode.details
            res.send({success: false, message: "SUBSCRIPTION ERROR"});
        }

    });

};

exports.unsubscribeChannel = function (req, res) {
    debug("user: ")
    debug(req.user)
    debug("body ")
    debug(req.body)

    if (req.body) {
        var data = req.body;
        data.user = req.user;
        context.unsubscribe(data, function (err, response) {
            debug("context.unsubscribe error:    " + err);
            debug("context.unsubscribe response: " + JSON.stringify(response));
            if (err)
                res.send({}, result.statusCode.code);

            req.channel.subscriptions = [];
            req.channel.subscribed = false;
            req.channel.save();
            res.send({channelId: req.channel._id});

        });
    }
};

exports.listSubscriptions = function (req, res) {
    // if (req.isAuthenticated()){
    //     debug("List subscriptions request");

    // var ChannelConstr = mongoose.model(req.channel.channel_type);
    //
    // ChannelConstr.findOne(
    //     {_id : req.channel._id},
    //
    //     function callback (err, doc) {
    //         if(err){
    //             debug("error while listing connections: " + err);
    //             res.send({success:false});
    //         } else

    debug("List sended!");
    res.send({success: true, data: req.channel.subscriptions});
    //     }
    // );
    // }
};

exports.discoveryContext = function (req, res) {
    debug('\n New discovery context request');

    var data = {"entities": [{"type": "", "isPattern": "true", "id": req.body.payload}]};

    debug("seach body: ");
    debug(data);
    var SocioTalDevice = mongoose.model("SocIoTalChannel");


    new SocioTalDevice().discoveryContext(data, function (statusCode, result) {
        debug("ContextBrocker discovery");
        debug("status code response : " + statusCode);

        debug("response body: " + JSON.stringify(result));
        // if(result.errorCode.code == 404)
        //     res.send({resu})

        res.send({result: result});
    });
};

//exports.registerDevice = function (req, res) {
//    debug('\n New register device/context request');
//
//    var SocioTalDevice = mongoose.model("SocIoTalDeviceChannel");
//    var channel = new SocioTalDevice({
//        title: req.body.title,
//        user:req.user,
//        channel_type : "SocIoTalDeviceChannel",
//        contextId :req.body.contextElements[0].id
//    });
//    delete req.body.title;
//    req.body.updateAction = "APPEND";
//
//    channel.registerDevice(req.body, "NGSI10", function(statusCode, response){
//        debug("Code response from Context Manager: " + statusCode);
//        debug("Response body: " + JSON.stringify(response));
//
//        // REGISTER VIRTUAL ENTITY FOR THIS DEVICE
//        if(statusCode == 200 && response.contextResponses != undefined){
//            debug("Device registered!!");
//            debug("Create a new channel for the device");
//
//            channel.attributes = response.contextResponses[0].contextElement.attributes;
//            debug("Channel to be saved");
//            debug(channel);
//
//            channel.save();
//
//            if(req.path.indexOf('/api/') > -1)
//                res.send(channel);
//            else
//                res.redirect('/channels/'+channel._id)
//
//        } else {
//            res.send({result: "RegisterDevice: Something goes wrong while registering the device in the Context Manager \n", response: response});
//        }
//
//
//    });
//}

exports.activateAnomalyDetection = function (req, res) {
    debug("inside activate anomaly detection");
    var activateAnomaly = req.param('activate');
    debug("activate anomaly is: " + activateAnomaly);

    req.channel.anomalyDetection = true;
    req.channel.save(function (err, result) {
        if (err) {
            debug("error while activating anomaly detection for channel " + req.channel.title + ": " + err);
            res.send({success: false});
        } else {
            debug("anomaly detection activated for channel:  " + req.channel.title);
            res.send({success: true});
        }
    });

    //
    // var ChannelConstr = mongoose.model(req.channel.channel_type);
    // ChannelConstr.update(
    //   {_id : req.channel._id},
    //   { $set: { 'anomalyDetection': true} },
    //   { multi: false },
    //
    //   function callback (err, numAffected) {
    //     if(err){
    //       debug("error while activating anomaly detection for channel " + req.channel.title + ": " + err);
    //       res.send({success:false});
    //     } else
    //       debug("anomaly detection activated for channel:  " + req.channel.title + " num = " + numAffected);
    //       res.send({success:true});
    //   }
    // );
};

exports.deactivateAnomalyDetection = function (req, res) {
    debug("inside deactivate anomaly detection");
    var activateAnomaly = req.param('activate');
    debug("activate anomaly is: " + activateAnomaly);

    req.channel.anomalyDetection = false;
    req.channel.save(function (err, result) {
        if (err) {
            debug("error while deactivating anomaly detection for channel " + req.channel.title + ": " + err);
            res.send({success: false});
        } else
            debug("anomaly detection deactivated for channel:  " + req.channel.title);
        res.send({success: true});
    });


    // var ChannelConstr = mongoose.model(req.channel.channel_type);
    // ChannelConstr.update(
    //   {_id : req.channel._id},
    //   { $set: { 'anomalyDetection': false} },
    //   { multi: false },
    //
    //   function callback (err, numAffected) {
    //     if(err){
    //       debug("error while deactivating anomaly detection for channel " + req.channel.title + ": " + err);
    //       res.send({success:false});
    //     } else
    //       debug("anomaly detection deactivated for channel:  " + req.channel.title + " num = " + numAffected);
    //     res.send({success:true});
    //   }
    // );
};


exports.receiveData = function (req, res) {

    var MAX_INBOX_SIZE = 500;
    var MAX_ANOMALY_SIZE = 50;
    debug("\nNew data incoming from ContextManager Pub/Sub");

    var device_data = req.body;
    var attributes = device_data.contextResponses[0].contextElement.attributes;
    var attributes_filtered = attributes.filter(function (item) {
        if (HIDDEN_PARAMS.indexOf(item.name) < 0) {           // check if the attribute is visible. remove owner and the update fields
            return item;
        }
    });

    var ChannelConstr = mongoose.model(req.channel.channel_type);

    // ChannelConstr.findOne({_id: req.channel._id}, {inbox: { $slice: -100 }}, function callback(err, channel) {
    ChannelConstr.findOne({_id: req.channel._id}, function callback(err, channel) {
            if (err) {
                debug("error while listing connections: " + err);
                res.send({success: false});
            } else {
                //var inbox = channel.inbox;
                var inbox = channel.inbox; //.slice(-MAX_ANOMALY_SIZE);
                //var inbox_trainset = inbox.slice(-MAX_ANOMALY_SIZE);
                //debug("inbox_trainset length: " + inbox_trainset.length)
                async.each(attributes_filtered, function (attribute, done) {
                    var current_trainset = {};
                    var attribute_name = attribute.name;
                    var data = {
                        date_created: new Date(),
                        request_type: "read",             // read, action, filter, ecc
                        data_type: attribute_name,     // current value, angolo, velocità ecc
                        value: attribute.value,
                        unit: '',
                        valid: true
                    };

                    // var h = inbox.filter(function (item) {
                    //     if (item.data_type == attribute_name) {
                    //         if (item.valid) return item;
                    //     }
                    // });

                    var inboxFiltered = lodash.filter(inbox, function(item) {
                        if (item.data_type === attribute_name) {
                            if (item.valid) return item;
                        }
                    });




                    current_trainset[attribute_name] = lodash.takeRight(inboxFiltered, trainset_size); // take last trainset values


                    var t_length = current_trainset[attribute_name].length;


                    //check if the value is a number, else the anomaly is skipped
                    if (!isNaN(attribute.value) && t_length >= trainset_size) {   // !isNaN returns true if is a number. check trainset size
                        //check anomaly for each attribute

                        anomalydetector.getAnomalies(req, current_trainset, data, function (result, req) {
                            debug("result: ");
                            debug(result);
                            debug("channel.anomalyDetection " + channel.anomalyDetection);
                            if (channel.anomalyDetection) {   // alert user if anomalyDetection is active
                                if (result.valid == false) {
                                    req.app.socketio.sockets.emit('new-anomaly', result);   // communicate anomaly event to the client
                                }
                            }

                            debug("INBOX LENGTH: " + inbox.length);
                            if(inbox.length >= MAX_INBOX_SIZE)
                                inbox.shift();

                            inbox.push(result);
                            done();
                        });
                    } else {
                        debug("INBOX LENGTH (not anomaly): " + inbox.length);

                        if(inbox.length >= MAX_INBOX_SIZE){
                            inbox.shift();
                        }

                        inbox.push(data);
                        done();
                    }


                    req.channel.runTriggers(attribute, req.app.ascoltatore);
                }, function (err) {
                    debug("inside last function " + err);
                    req.app.socketio.sockets.emit('new-data-' + req.channel._id, {success: true});

                    channel.save();
                    res.status(200).end();

                });
            }
        }
    );



};


exports.logWrite = function (req, res) {
    debug("\nNew data incoming from ContextManager Pub/Sub");
    var device_data = req.body;
    debug(JSON.stringify(device_data));

    res.send(device_data);
};


/**
 * Run a channel task from UI
 */

exports.run = function (req, res) {
    debug("\n--------------------------------");
    debug("New task run request ");

    var queryObject = url.parse(req.url, true).query;
    debug("request action: " + queryObject.action);

    switch (queryObject.action) {
        case "start":
            startRun(req, res);
            break;
        case "stop":
            stopRun(req, res);
            break;
    }

    debug("End run!!! ");
    debug("--------------------------------\n");

};

function startRun(req, res) {
    var agenda = req.app.agenda;
    var ascoltatore = req.app.ascoltatore;
    var channel = req.channel;
    var interval = channel.interval_sec;
    var name = channel.title;
    var id = channel._id;
    var jobname = name + "_" + id;


    if (channel.subscribed) {
        // update
        debug(jobname + ' is running');
    } else {
        // create new job
        agenda.define(jobname, function (job, done) {
            debug("start job... " + job.attrs.name);
            channel.shotEvent(ascoltatore, req.app.socketio);
            done();
        });
        debug("channel interval  " + interval);

        agenda.every(interval + ' seconds', jobname);

        channel.subscribed = true;
        channel.save();
    }
    res.send(JSON.stringify({success: "true", started: "true"}));
}

function stopRun(req, res) {
    var agenda = req.app.agenda;

    var result = {success: true, stopped: false};

    var name = req.channel.title;
    var id = req.channel._id;
    var jobname = name + "_" + id;
    debug("Stopping channel " + jobname);

    agenda.cancel({'name': jobname}, function (err, numRemoved) {
        debug("removed: " + numRemoved);
        var channel = req.channel;
        if (channel.subscribed) {
            channel.subscribed = false;
            channel.save();
            debug("channel stopped!! ");
            result.stopped = true;
        }
        res.send(JSON.stringify(result));
    });


}

/**
 * Delete data for a channel
 */

exports.clearData = function (req, res) {
    var ChannelConstr = mongoose.model(req.channel.channel_type);
    ChannelConstr.update(
        {_id: req.channel._id},
        {$set: {'inbox': []}},
        {multi: false},

        function callback(err, numAffected) {
            if (err) {
                debug("error while cleaning data for channel " + req.channel.title + ": " + err);
                res.send({success: false});
            } else
                res.send({success: true});
        }
    );
};

/**
 * List data for a channel
 */

exports.listData = function (req, res) {
    var ChannelConstr = mongoose.model(req.channel.channel_type);

    ChannelConstr.findOne(
        {_id: req.channel._id},

        function callback(err, channel) {
            if (err) {
                debug("error while listing data: " + err);
                res.send({success: false});
            } else {
                var data = null;
                var inbox = channel.inbox;
                if (inbox) {
                    inbox.sort(function (a, b) {
                        var dateA = new Date(a.date_created);
                        var dateB = new Date(b.date_created);
                        return dateB - dateA;
                    });

                    data = {
                        success: true,
                        data: inbox,
                        is_running: channel.subscribed,
                        anomalyDetection: channel.anomalyDetection
                    };
                } else
                    data = {success: false, data: data};

                res.send(data);
            }
        }
    );
};


/***************************************************************************/

//
///**
// * Detect anomalies in the data for a channel
// */
//
//
//exports.detectAnomaly = function (req, res) {
//    var inbox = req.channel.inbox;
//
//    if(inbox){
//        anomalydetector.getAnomalies(inbox, {"_id":"56b8ac1afe9490922ec55040","unit":"","value":"55.07732165744528","data_type":"AmbientTemperature","request_type":"read","date_created":"2016-02-08T14:54:18.982Z"}, function(err, result){
//            if (err){
//                return res.status(200).send({error: "error in detecting anomaly"});
//            } else {
//                return res.status(200).send(result);
//            }
//
//        });
//    }
//};

/***************************************************************************/


/**
 * Update channel
 */
exports.update = function (req, res) {
    var channel = req.channel;
    channel = extend(channel, req.body);
    channel.uploadAndSave(req.files.image, function (err) {
        if (!err) {
            return res.redirect('/channels/' + channel._id);
        }

        res.render('channels/edit', {
            title: 'Edit Channel',
            channel: channel,
            error: utils.errors(err.errors || err)
        });
    });
};


/**
 * Update channel
 */
exports.updateChannel = function (req, res) {
    /*************************** VALIDATION *********************************/
    req.checkBody('channel_type', 'channel_type field is required').notEmpty();
    req.checkBody('title', 'title field is required').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        var err_msg = 'There have been validation errors: ';
        for (var i = 0; i < errors.length; i++)
            err_msg += errors[i].msg + "; ";

        res.send({"status": 400, "message": err_msg}, 400);
        return;
    }
    /*************************** END VALIDATION ******************************/

    var channel = req.channel;
    channel = extend(channel, req.body);

    var image = (typeof req.files != 'undefined') ? req.files.image : "";
    channel.uploadAndSave(image, function (err) {
        if (err) {
            debug(err);
            res.send(err, 500);
        }
        var new_channel = renameId(channel);
        new_channel.user = renameId(new_channel.user);

        res.send({channel: new_channel});
    });
};


/**
 * Show
 */
exports.show = function (req, res) {

    var ChannelConstr = mongoose.model(req.channel.channel_type);

    var currentChannelTriggers = ChannelConstr.triggerDictionary;
    var actionChannels = [];

    Channel.find({user: req.user._id}, function (err, channels) {
        channels.forEach(function (item) {
            var actionShow = mongoose.model(item.channel_type).actionDictionary;
            // only channels that have actions
            if (actionShow.length > 0)
                actionChannels.push({title: item.title, id: item._id, actionShow: actionShow});

        });

        var details_file = "";
        config.channelsJadeTemplates.forEach(function (template) {
            if (template.type === req.channel.channel_type) {
                details_file = template.details;
            }
        });

        res.render('channels/' + details_file, {
            title: req.channel.title,
            channel: req.channel,
            //socketioUrl: "http://" + req.host + ":" + config.port,
            actionChannels: actionChannels,
            channelTriggers: currentChannelTriggers,
            channel_type: req.channel.channel_type
        });
    });

};


/**
 * Delete an channel
 */
exports.destroy = function (req, res) {
    debug("delete channel");
    var channel = req.channel;
    if (typeof channel !== 'undefined') {
        channel.remove(function (err) {
            req.flash('info', 'Deleted successfully');
            if (err) return res.send(err, 500);


            if (req.path.indexOf('/api/') > -1)
                res.send(200);
            else {
                // res.redirect('/channels');
                res.send({message: "Channel deleted"}, 200);
            }

        });
    } else {
        if (req.path.indexOf('/api/') > -1)
            res.send({error: 404, message: "Channel not found!"}, 404);
        else
            res.redirect('/channels');
    }
};


/******************************************************************************/
/****************************** TRIGGERS PART  ******************************/
/******************************************************************************/

exports.listTriggers = function (req, res) {
    debug("Get triggers list: " + req.params.data_type);
    var type = req.params.data_type;

    var Triggers = mongoose.model('TriggerSchema');
    debug("Searching triggers for type: " + type);

    var class_name = Triggers.classes.filter(function (item) {
        if (item.types.indexOf(type) > -1) {
            return item;
        } else {
            return null;
        }
    });
    if (class_name.length > 0) {
        var tr = Triggers.triggers.filter(function (item) {
            if (item.class_name === class_name[0].name)
                return item;
        });
        debug(tr.length + " found");
    }

    res.send(tr);

};

/******************************************************************************/
/****************************** ATTRIBUTES PART  ******************************/
/******************************************************************************/


exports.saveAttribute = function (req, res) {
    debug("Save new attribute for channel: " + req.channel.title);
    if (!req.channel) {
        debug("error while saving attribute: ");
        res.send({result: "failed"});
    }

    var attribute = {
        name: req.body.attribute_name,
        type: req.body.attribute_type,
        value: req.body.attribute_default_value, metadatas: req.body.metadata, date_created: new Date()
    };


    debug(req.body);
    //debug("attribute: " + JSON.stringify(attribute));

    switch (req.body.mode) {
        case "new":

            req.channel.attributes.push(attribute);
            debug("New attribute created! ");

            break;
        case "update":
            var attributeId = req.body.attributeId;

            debug("attributeId: " + attributeId);
            if (attributeId) {
                var attr = req.channel.attributes.filter(function (item) {
                    return (item._id == attributeId);
                });
                //debug("attr: " + attr[0]);

                var index = req.channel.attributes.indexOf(attr[0]);

                req.channel.attributes.splice(index, 1);
                debug("\n\n");
                debug(attribute);
                req.channel.attributes.push(attribute);

                debug("Attribute updated! ");
            }
            break;
    }
    req.channel.save();
    res.send({channelId: req.channel._id});

};


/**
 * list all attributes for a channel
 */

exports.listAttributes = function (req, res) {
    debug("List attributes request");
    debug("This works only for SocIoTalChannel");

    var channelTypes = ['SocIoTalChannel'];

    if (channelTypes.indexOf(req.channel.channel_type) > -1) {
        var ChannelConstr = mongoose.model(req.channel.channel_type);

        ChannelConstr.findOne(
            {_id: req.channel._id},

            function callback(err, doc) {
                if (err) {
                    debug("error while listing attributes: " + err);
                    res.send({success: false});
                } else
                    debug("Success attribute list");
                debug("List sent!");
                res.send({data: doc.attributes});
            }
        );
    } else {
        debug("This channel has not attribute");
        res.send({data: ""});
    }
};

exports.deleteAttribute = function (req, res) {

    debug("Delete attribute for channel: " + req.channel.title);
    if (!req.channel) {
        debug("error while attribute sensor: ");
        res.send({result: "failed"});
    }

    var attributeId = req.params.attributeId;
    if (attributeId) {
        var attr = req.channel.attributes.filter(function (item) {
            return (item._id == attributeId);
        });
        var index = req.channel.attributes.indexOf(attr[0]);
        req.channel.attributes.splice(index, 1);
    }
    req.channel.save();

    debug("attribute deleted! ");
    res.send({channelId: req.channel._id});

};
