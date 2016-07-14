

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Context = mongoose.model('ContextSchema');
var utils = require('../../lib/utils');
var lodash = require('lodash');


var url = require('url');
var http = require("http");
var https = require("https");

var debug = require('debug')('controllers:contextV3');
var capability = require("./security-manager/capability/capabilityV3.js");
var communities = require("./communities.js");  // to get owner info


var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var cmEndpoint = config.contextManager[process.env.CM || 'v1Http'];


var parsedServerURL = url.parse(cmEndpoint);

var UCSERVER = {    protocol: parsedServerURL.protocol + "//",
    host: parsedServerURL.hostname,
    port : parsedServerURL.port,
    basepath_NGSI10 : parsedServerURL.pathname + "/NGSI10_API",
    basepath_NGSI09 : parsedServerURL.pathname + "/NGSI9_API"
};


/**
 * Load
 */

exports.load = function(req, res, next, id){
    Context.load(id, function (err, context) {
        if (err) return next(err);
        if (!context) return next(new Error('Context not found'));
        req.context = context;
        next();
    });
};


exports.listView = function(req, res){
    var attributes = [];
    Context.templates.forEach(function(template){
        template.attributes.forEach(function(attribute){
            attributes.push(attribute.name);
        });
    });


    res.render('devices/index', {
            title: 'Devices',
            devices: [],
            count: 0,
            attributes: attributes,
            params: req.query,
            community_name: req.query.community_name
    });

};





exports.list = function(req, res, next){

    //debug(" req ------> " + JSON.stringify(req));
    debug("req.path: " + req.path);
    debug("exports.list:");
    debug("community_name: " + req.query.community_name);

    communities.getCommunityToken(req.user.idm_token, req.query.community_name, "default", function(error, communityToken) {

        if (error || req.query.community_name == "0C" || req.query.field === "count") {
            communityToken = null
        }


        var attributes = [];
        Context.templates.forEach(function (template) {
            template.attributes.forEach(function (attribute) {
                attributes.push(attribute.name);
            });
        });

        debug("attributes");
        debug(attributes);

        var data = {
            "entities": [
                {
                    "type": "",
                    "isPattern": "true",
                    "id": "SocIoTal:.*"
                }]
        };

        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext?limit=100";
        debug("the url is: " + url);
        debug("data to send: ");
        debug(JSON.stringify(data));
        debug("user idm_id " + req.user.idm_id);
        debug("user idm_token " + req.user.idm_token);


        var options = {

            resource: url,
            ngsi_action: "queryContext",
            context_id: "*",
            payload: JSON.stringify(data),
            community_token: communityToken,
            idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token: req.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();

        };

        capability.getCMResource(options, function (error, response) {
            if (error) {
                if (error.error === 401)
                    return next(new Error('idm_token_expired'));

            } else {
                evalCMResponse(response, function (err, result) {
                    var devices = [];

                    if (err !== null && err.error === 401) {
                        // res.send(err, 401);
                        res.send(new Error('idm_token_expired'), null);
                    } else {

                        if(response.errorCode.code == 404){
                            res.send({devices: []});
                        }else {

                            debug("response is: " + JSON.stringify(response));
                            response.contextResponses.forEach(function (element) {
                                devices.push(element.contextElement);
                            });

                            if (req.query.field !== undefined && req.query.field === 'count') {
                                debug("req files " + req.query.field);
                                res.send({count: devices.length});
                            }
                            else {
                                res.send({devices: response});
                            }
                        }
                    }
                });
            }
        });
    });


}

















exports.new = function(req, res){
    res.render('devices/new', {
        title: 'New device',
        templates: Context.templates,
    });
};


exports.form = function(req, res){
    var device_type = req.params.type;
    var selected_device = "";
    var templateAttributes;

    Context.templates.forEach(function(template){
        if(template.name == device_type){
            selected_device = template;
        }
    });

    //check if it is a bubble
    if (device_type.toLowerCase() == 'bubble') {
        templateAttributes = Context.templatesAttributesForBubble;
    } if (device_type.toLowerCase() == 'weatherstation') {
        templateAttributes = Context.templatesAttributesForWeatherStation;
    }else{
        templateAttributes = Context.templatesAttributesComplete;
    }
    

    var options = {
        title: 'New Device',
        params: req.query,
        mode :"new",
        device_type : device_type,
        device: selected_device,
        //device_list:devices,
        templates: Context.templates,
        templatesAttributes: templateAttributes,
        ownerID: req.user.idm_id
    };

    debug("selected_device is ", selected_device);



    res.render('devices/forms/create', options);
};






exports.edit = function (req, res) {
    debug("Edit Context");

    var data = {
        "entities":[
            {"type":"",
                "isPattern":"true",
                "id": req.param("context_id")
            }]
        };


    communities.getCommunityToken(req.user.idm_token, req.body.context.community, "default", function(error, communityToken) {

        if (error || req.query.community_name === "0C") {
            communityToken = null
        }


        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";

        debug("the url is: " + url);
        debug("data to send: ");
        debug(JSON.stringify(data));

        var options = {

            resource: url,
            ngsi_action: "queryContext",
            context_id: req.params("context_id"),
            payload: JSON.stringify(data),
            community_token: communityToken,

            idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token: req.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();

        };
        debug("\n\n\n\n\ ***************** OPTIONS to send: ");
        debug(JSON.stringify(data));

        capability.getCMResource(options, function (statusCode, response) {
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));

            if (response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});
            if (statusCode == 200 && response.contextResponses !== undefined) {
                var context = response.contextResponses[0].contextElement;

                var title = context.id.split(":")[3];
                context.title = title;
                res.render('devices/forms/create', {
                    title: 'Edit ' + title,
                    device: context,
                    mode: "edit"
                });
            }

        });
    });
};

exports.show = function (req, res) {
    debug("Show Context");

    var data = {"entities":[
        {"type":"",
            "isPattern":"true",
            "id": req.param("context_id")
        }
    ]
    };


    communities.getCommunityToken(req.user.idm_token, req.query.community_name, "default", function(error, communityToken) {

        if (error || req.query.community_name === "0C") {
            communityToken = null
        }


        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";

        debug("the url is: " + url);
        debug("data to send: ");
        debug(JSON.stringify(data));

        var options = {

            resource: url,
            ngsi_action: "queryContext",
            context_id: req.param("context_id"),
            payload: JSON.stringify(data),
            community_token: communityToken,

            idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token: req.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();

        };


        capability.getCMResource(options, function (statusCode, response) {
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));

            if (response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});
            if (response.contextResponses !== undefined) {
                var context = response.contextResponses[0].contextElement;

                var owner_id;
                var userinfo;
                var owner_nickname;
                context.attributes.forEach(function (attribute) {
                    if (attribute.name == "Owner") {
                        owner_id = attribute.value;
                    }
                });

                communities.getUserInfoByID(req, res, owner_id, function (result) {
                    var title = context.id.split(":")[3];
                    context.title = title;

                    if (result != null) {
                        userinfo = result;
                        owner_nickname = result.nickName;
                    } else {
                        owner_nickname = "not specified";
                    }

                    res.render('devices/details', {
                        title: 'Edit ' + title,
                        device: context,
                        owner_nickname: owner_nickname,
                        community_name: req.query.community_name,
                        mode: "edit"
                    });

                });


            }
        });

    });
};



exports.register = function (req, res) {
    debug('\n New register Context request');

    var dev = req.body.context;
    dev.user = req.user.idm_id;

    var action = "APPEND"; ///************


    var create_channel = req.body.create_channel;
    debug("exports.register  req.body: "+JSON.stringify(req.body));
    debug("exports.register  create_channel " + create_channel);
    if(create_channel == "true"){
        // CREATE CHANNEL (VIRTUAL ENTITY)
        var ContextChannel = mongoose.model("SocIoTalChannel");
        var channel = new ContextChannel({
            title: req.body.context.name,
            user:req.user._id,
            channel_type : "SocIoTalChannel",
            contextId :req.body.context.context_id,
            contextType: req.body.context.type,
            contextCommunity: req.body.context.community
        });
        debug('\n Preparing channel...');

    }

    if (dev.action)
        action = dev.action;

    var context = { "contextElements": [{
        "type": req.body.context.type,
        "isPattern": "false",
        "id": req.body.context.context_id,
        "attributes": req.body.context.attributes
    }],
        updateAction : action
    };

    var url =   UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(context));




    communities.getCommunityToken(req.user.idm_token, req.body.context.community, req.body.context.domain, function(error, communityToken) {


            // check if the community is ALL - 0C. If so no community token will be provided.
            if (req.body.context.community == "0C"){
                communityToken = null;
            }

            var options = {

                resource: url,
                ngsi_action: "updateContext",
                context_id: req.body.context.context_id,
                payload: JSON.stringify(context),
                idm_id: req.user.idm_id,
                idm_token: req.user.idm_token,
                community_token : communityToken,
                cap_token: null //this is always a JAVA object To see the content use .toString();

            };


            if (!communityToken){

                var opt = {
                    url: url,
                    headers : {"Content-Type" : "application/json", "Accept" : "application/json"},
                    body: JSON.stringify(context)
                };

                debug("\n\n\n " + opt );

                request.post(opt, function(err, response, body){
                    debug("Response body: " + JSON.stringify(body));
                    if (body.error !== undefined && body.error == 401) res.send({message: "Context Manager not available: Unauthorized "});

                    // REGISTER VIRTUAL ENTITY FOR THIS DEVICE
                    //if(response.contextResponses !== undefined && response.contextResponses[0].code === "200"){
                    debug("Device registered!!");
                    if (create_channel == "true") {

                        debug("Create a new channel for the device");

                        body = JSON.parse(body);

                        channel.attributes = body.contextResponses[0].contextElement.attributes;
                        debug("Channel to be saved");
                        debug(channel);

                        channel.save();
                        //context.save();
                        debug("Channel saved!!");

                        if (req.path.indexOf('/api/') > -1)
                            res.send(channel);
                        else {
                            debug("response to client : " + JSON.stringify({channel_id: channel._id}));
                            res.send({channel_id: channel._id});
                        }

                    } else {
                        res.send({channel_id: undefined});
                    }
                })



            } else {
                capability.getCMResource(options, function (statusCode, response) {
                    debug("Errors from Context Manager: " + statusCode);
                    debug("Response body: " + JSON.stringify(response));
                    if (response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});

                    // REGISTER VIRTUAL ENTITY FOR THIS DEVICE
                    //if(response.contextResponses !== undefined && response.contextResponses[0].code === "200"){
                    debug("Device registered!!");
                    if (create_channel == "true") {

                        debug("Create a new channel for the device");

                        channel.attributes = response.contextResponses[0].contextElement.attributes;
                        debug("Channel to be saved");
                        debug(channel);

                        channel.save();
                        //context.save();
                        debug("Channel saved!!");

                        if (req.path.indexOf('/api/') > -1)
                            res.send(channel);
                        else {
                            debug("response to client : " + JSON.stringify({channel_id: channel._id}));
                            res.send({channel_id: channel._id});
                        }

                    } else {
                        res.send({channel_id: undefined});
                    }

                    //} else {
                    //    res.send({result: "RegisterDevice: Something goes wrong while registering the device in the Context Manager \n", response: response});
                    //}
                });

            }

    });
};


exports.update = function (req, res) { // to be finished
    debug('\n Update Context request');
    debug('\n body: ');
    debug(req.body);
    var dev = req.body;
    console.log(req.body);
    var action = (req.body.action !== undefined ) ? req.body.action : "UPDATE";
    var context = { "contextElements": [{
        "type": req.body.context.type,
        "isPattern": "false",
        "id": req.body.context.id,
        "attributes": req.body.context.attributes
    }],
        updateAction : "UPDATE"
    };


    communities.getCommunityToken(req.user.idm_token, req.body.context.community, "default", function(error, communityToken) {

        if (error || req.query.community_name === "0C") {
            communityToken = null
        }

        var url =   UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
        debug("the url is: " + url);
        debug("data to send: " );
        debug(JSON.stringify(context));

        var options = {
            resource : url,
            ngsi_action: "updateContext",
            context_id : req.body.context.id,
            payload: JSON.stringify(context),
            community_token : communityToken,

            idm_id : req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token : req.user.idm_token,
            cap_token : null //this is always a JAVA object To see the content use .toString();

        };
        debug("\n\n\n\n\n\n\n ********************* OPTIONS ARE: "+JSON.stringify(options));


        capability.getCMResource(options, function(statusCode, response){
            // debug("Code response from Context Manager: " +  JSON.stringify(statusCode));
            // debug("Response body: " + JSON.stringify(response));
            if(response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});

            // REGISTER VIRTUAL ENTITY FOR THIS DEVICE
            if(statusCode == 200 && response.contextResponses !== undefined){
                res.send({result: response.contextResponses[0].contextElement});
            } else {
                res.send({result: "RegisterDevice: Something goes wrong while registering the device in the Context Manager \n", response: response});
            }
        });
    });


};

exports.delete = function (req, res) {
    var id = req.param("context_id");
    var community_name = req.body.community_name;
    var type = req.body.type;
    var context = {
        "contextElements": [{
            "id": id,
            "type": type,
            "isPattern": "false"
        }],
        "updateAction": "DELETE"
    };

    communities.getCommunityToken(req.user.idm_token, community_name, "default", function(error, communityToken) {

        if (error || community_name == "0C") {
            communityToken = null
        }

        debug("Context Manager deleteContext");
        debug("community_token "+communityToken);
        debug("idm_token UUID "+req.user.idm_token);
        debug("req.query.community_name "+community_name);

        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
        debug("the url is: " + url);
        debug("data to send: ");
        debug(JSON.stringify(context));

        var options = {

            resource: url,
            ngsi_action: "updateContext",
            context_id: req.param("context_id"),
            payload: JSON.stringify(context),
            community_token: communityToken,

            idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token: req.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();

        };


        capability.getCMResource(options, function (statusCode, response) {
            debug("Code response from Context Manager: " + statusCode);
            // debug("Response body: " + JSON.stringify(response));
            if (response.errorCode == undefined) {
                res.send({success: true});
            } else {
                res.send({success: false, message: "Context Manager not available: Unauthorized "});
            }

        });
    });
};

exports.discovery_GET = function (req, res) {
    var attributes = [];
    Context.templates.forEach(function(template){
        template.attributes.forEach(function(attribute){
            attributes.push(attribute.name);
        });
    });

    res.render('devices/discover', {
        title: 'Discovery',
        attributes: attributes
    });
};




exports.discovery_POST = function (req, res, next) {
    debug('\n New discovery context request');

    var data =  {"entities":
        [{"type": "",
            "isPattern": "true",
            "id": "SocIoTal:*"}],
        "attributes": req.body.attributes
    };


    var url =  UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(data);

    var options = {

        resource : url,
        ngsi_action: "queryContext",
        context_id : "*",
        payload: JSON.stringify(data),

        idm_id : req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
        idm_token : req.user.idm_token,
        cap_token : null //this is always a JAVA object To see the content use .toString();

    };


    capability.getCMResource(options, function(error, response){
        debug("ContextBrocker discovery");
        if(error){
            if(error.error === 401)
                return next(new Error('idm_token_expired'));

        } else {
            evalCMResponse(response, function(err, result) {
                var result = [];
                if(err !== null && err.error === 401){
                    return next(new Error('idm_token_expired'));
                } else {
                    if (response.contextResponses !== undefined) {
                        response.contextResponses.forEach(function (element) {
                            result.push(element.contextElement);

                        });
                        res.send({elements: result});
                    } else {
                        res.send({elements: "No contexts found!!"});
                    }
                }
            });
        }
    });

};


exports.subscribe = function(req, form_data, onResult){
    debug("Context Manager subscribeContext");

    var base_url =  "https://" +  form_data.hostname + ":" + config.port;
    var reference = base_url + "/api/channels/" + form_data.channel_id + "/receive";
    debug("form_data received: "+JSON.stringify(form_data));
    var community_name = form_data.community_name;

    var data = {"entities": [{
        "isPattern": "false",
        "type": form_data.context_type,
        "id": form_data.context_id
    }],
        //"attributes": form_data.attributes,
        "reference": reference,
        "duration": form_data.duration,
        "notifyConditions": [{"type": form_data.condition_type, "condValues": form_data.condition_value}],
        "throttling": "PT5S"
    };
    debug("attributes = "+form_data.attributes);
    console.log(data);

    communities.getCommunityToken(req.user.idm_token, community_name, "default", function(error, communityToken) {

        if (error || community_name == "0C") {
            communityToken = null
        }

        debug("Context Manager deleteContext");
        debug("community_token " + communityToken);
        debug("idm_token UUID " + req.user.idm_token);
        debug("community_name " + community_name);

        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/subscribeContext";
        debug("the url is: " + url);
        debug("data to send: ");
        debug(JSON.stringify(data));

        var options = {

            resource: url,
            ngsi_action: "subscribeContext",
            context_id: form_data.context_id,
            payload: JSON.stringify(data),
            community_token: communityToken,
            idm_id: req.user.idm_id, //"d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
            idm_token: req.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();

        };

        debug(options);

        capability.getCMResource(options, onResult);
    });
};

exports.unsubscribe = function(data, _cb){
    debug("Context Manager unsubscribeContext");

    var community_name = data.community_name;

    debug("data is: "+JSON.stringify(data));


    communities.getCommunityToken(data.user.idm_token, community_name, "default", function(error, communityToken) {

        if (error || community_name == "0C") {
            communityToken = null
        }

        debug("Context Manager deleteContext");
        debug("community_token " + communityToken);
        debug("idm_token UUID " + data.user.idm_token);
        debug("community_name " + community_name);

        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/unsubscribeContext";
        debug("the url is: " + url);
        debug("data to send: ");
        var unsub = {subscriptionId: data.subscription_id};
        debug(unsub);

        var options = {
            resource: url,
            ngsi_action: "unsubscribeContext",
            context_id: data.context_id,
            community_token: communityToken,
            payload: JSON.stringify(unsub),
            idm_id: data.user.idm_id,
            idm_token: data.user.idm_token,
            cap_token: null //this is always a JAVA object To see the content use .toString();
        };

        debug(options);

        capability.getCMResource(options, function (error, cmResponse) {
            if (error)
                _cb(error, null);
            else if (cmResponse.statusCode !== undefined)
                if (cmResponse.statusCode.code === "200")
                    _cb(null, cmResponse);
                else
                    requestWithoutCapToken(options, _cb);


        });
    });
};


function evalCMResponse(response, next) {

    debug("evalCMResponse -- Evaluating Context Manager response..." );
    var err = null;
    if (response.errorCode.code !== "200"){
        debug("Context Manager response has errors: " + JSON.stringify(response.errorCode));
        switch (response.errorCode.code) {
            case "401":     // unauthorized
                err = 401;
                break;
            case "404":     // not found
                err = 404;
                break;
            case "403":     // not permitted
                err = 403;
                break;
        }
        next({error: err}, null);
    } else {
        debug("Context Manager response has not errors.");
        next(null, response);
    }
}


var request = require('request');
function requestWithoutCapToken(options, _cb){
    var url = options.resource;
    url = url.replace("https", "http");
    url = url.replace("3501", "3500");

    var opt = {
        url : url,
        body: options.payload,
        headers : {"Content-Type": "application/json", "Accept": "application/json"}

    };
    capability.clearCapabilityFolder();
    request.post(opt, function(err, response, body){
        debug("in request post.... ")
        debug("error " + err);
        debug("body " + body);
        if(body){
            _cb(null, JSON.parse(body));
        }
    })
}

exports.genCapabilityToken = function (req, res) {
    var options = req.body;
    options.idm_id = req.user.idm_id;
    options.idm_token = req.user.idm_token;

    /*
     var opr =
     {
     resource : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/queryContext",
     ngsi_action: "queryContext",
     context_id : "*",
     idm_id : "d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
     idm_token : "fd10f5bb46044866a3288c93948f2f89"
     }
     */
    capability.getCapabilityToken(options, function(error, response){
        if(error !== undefined)
            res.send(500, response);
        else
            res.send(200, response);
    })
};
