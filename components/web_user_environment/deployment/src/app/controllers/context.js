

// TO BE UPDATED FOLLOWING CONTEXT V3








/**
 * Module dependencies.
 */
var debug = require('debug')('controllers:context');
var mongoose = require('mongoose');
var Context = mongoose.model('ContextSchema');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var app = require('../../server');
var url = require('url');
var http = require("http");
var https = require("https");

var debug = require('debug')('controllers:context');
var capability = require("./security-manager/capability/capability.js");


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
    var User = mongoose.model('User');
    Context.load(id, function (err, context) {
        if (err) return next(err);
        if (!context) return next(new Error('Context not found'));
        req.context = context;
        next();
    });
};




//exports.index = function(req, res){
//   var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
//    debug(req.body);
//   if (req.isAuthenticated()){\
//        var current_user = req.user._id
//        var perPage = 30
//        var options = {
//              perPage: perPage,
//              page: page,
//              criteria: {user: current_user}
//        }
//        Channel.list(options, function(err, channels) {
//            if (err) return res.send(err,500);
//            //if (!channels || channels.length < 1) return res.send("No channel with this id exists!", 404);
//            Channel.count().exec(function (err, count) {
//
//                req.channels = channels;
//                debug("channels find: " + channels.length);
//
//                if (req.path.indexOf('/api/') > -1) {
//
//                    res.send({channels: channels}, 200);
//                } else {
//
//                    res.render('channels/index', {
//                        title: 'Channels',
//                        channels: channels,
//                        page: page + 1,
//                        pages: Math.ceil(count / perPage)
//
//                    })
//                }
//            });
//        });
//    } else {
//       res.redirect('/login');
//   }
//}

exports.listView = function(req, res){
    debug("in listview")
    return res.render('devices/index', {
        title: 'Devices'

    });
};


exports.list = function(req, res){

    debug(" PARAMS ------> " + req.query.field);


    debug("req.path: " + req.path);
    debug("exports.list:");


    var attributes = [];
    Context.templates.forEach(function(template){
        template.attributes.forEach(function(attribute){
            attributes.push(attribute.name);
        });
    });




        var data = {"entities":[
                {"type":"",
                    "isPattern":"true",
                    "id":"SocIoTal:.*"
                }]

        };

        debug("attributes");
        debug(attributes);


        var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";
        debug("the url is: " + url);
        debug("data to send: " );
        debug(JSON.stringify(data));

        capability.requestToken(url, function (capability_token){
            http_post(url, data, capability_token, function(statusCode, response){
                debug("Code response from Context Manager: " + statusCode);
                //debug("Response body: " + JSON.stringify(response));

                var devices = [];

                if(response.errorCode !== undefined && response.contextResponses === undefined) {
                    //return res.send({message: response.errorCode.reasonPhrase});
                    return res.render('devices/index', {
                        title: 'Devices',
                        devices: devices,
                        error: response.errorCode.reasonPhrase,
                        params: req.query
                    });
                }


                if(response.contextResponses !== undefined){
                    response.contextResponses.forEach(function(element){
                        devices.push(element.contextElement);
                    });


                    if(req.query.field !== undefined && req.query.field === 'count'){
                        res.send({count: devices.length});
                    }
                    else{
                        //res.send(devices);
                        res.render('devices/index', {
                            title: 'Devices',
                            devices: devices,
                            attributes:attributes,
                            params: req.query
                        });
                    }
                }
            });
        });

};




exports.new = function(req, res){
    res.render('devices/new', {
        title: 'New device',
        templates: Context.templates,
    });
};





// /**
//  * New channel
//  */

exports.form = function(req, res){
    var device_type = req.params.type;
    var selected_device = "";

    Context.templates.forEach(function(template){
        if(template.name == device_type){
            selected_device = template;
        }
    });

    debug("Device Type is: "+device_type);
    debug("Device Name is: "+req.params.name);

    debug("req is: "+req);

    var options = {
        title: 'New Device',
        params: req.query,
        mode :"new",
        device_type : device_type,
        device: selected_device,
        templates: Context.templates,
        templatesAttributes: Context.templatesAttributes
    };

    debug("selected_device is ", selected_device);

    res.render('devices/forms/create', options);
};



exports.edit = function (req, res) {
    debug("Edit Context");

    var data = {"entities":[
        {"type":"",
            "isPattern":"true",
            "id": req.param("context_id")
        }
    ]
    };

    var url =  UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";

    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(data));

    capability.requestToken(url, function (capability_token){
        http_post(url, data, capability_token, function(statusCode, response){
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));

            if(response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});
            if(statusCode == 200 && response.contextResponses !== undefined){
                var context = response.contextResponses[0].contextElement;

                var title = context.id.split(":")[3];
                context.title = title;
                res.render('devices/forms/create', {
                    title: 'Edit ' + title,
                    device: context,
                    mode :"edit"
                });
            }

        });
    });
};

// controllare perché uguale a edit
exports.show = function (req, res) {
    debug("Show Context");

    var data = {"entities":[
        {"type":"",
            "isPattern":"true",
            "id": req.param("context_id")
        }
    ]
    };

    var url =  UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";

    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(data));

    capability.requestToken(url, function (capability_token){
        http_post(url, data, capability_token, function(statusCode, response){
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));

            if(response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});
            if(statusCode == 200 && response.contextResponses !== undefined){
                var context = response.contextResponses[0].contextElement;

                var title = context.id.split(":")[3];
                context.title = title;
                res.render('devices/details', {
                    title: 'Edit ' + title,
                    device: context,
                    mode :"edit"
                });
            }

        });
    });
};



exports.register = function (req, res) {
    debug('\n New register Context request');
    debug('\n\n\n req.body: ' + req.body);
    var dev = req.body.context;
    dev.user = req.user._id;
    // CREATE Context
    //var Context = new Context(req.body);

    var create_channel = req.body.create_channel;
    debug("create_channel " + create_channel);
    if(create_channel == "true"){
        // CREATE CHANNEL (VIRTUAL ENTITY)
        var ContextChannel = mongoose.model("SocIoTalChannel");
        var channel = new ContextChannel({
            title: req.body.context.name,
            user:req.user._id,
            channel_type : "SocIoTalChannel",
            contextId :req.body.context.context_id,
            contextType: req.body.context.type
        });
        debug('\n Preparing channel...');

    }
    var context = { "contextElements": [{
        "type": req.body.context.type,
        "isPattern": "false",
        "id": req.body.context.context_id,
        "attributes": req.body.context.attributes
    }],
        updateAction : "APPEND"
    };
    debug(context);

    var url =   UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(context));
    capability.requestToken(url, function (capability_token){
        http_post(url, context, capability_token, function(statusCode, response){
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));
            if(response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});

            // REGISTER VIRTUAL ENTITY FOR THIS DEVICE
            //if(statusCode == 200 && response.contextResponses !== undefined){
                debug("Device registered!!");
                if(create_channel == "true") {

                    debug("Create a new channel for the device");

                    channel.attributes = response.contextResponses[0].contextElement.attributes;
                    debug("Channel to be saved");
                    debug(channel);

                    channel.save();
                    //context.save();
                    debug("Channel saved!!");

                    if (req.path.indexOf('/api/') > -1)
                        res.send(channel);
                    else{
                        debug("send channel id to client");
                        debug({channel_id: channel._id});
                        res.send({channel_id: channel._id});
                    }
                } else {
                    res.send({channel_id: undefined});
                }
            //} else {
            //    res.send({result: "RegisterDevice: Something goes wrong while registering the device in the Context Manager \n", response: response});
            //}


        });
    });
};


exports.update = function (req, res) { // to be finished
    debug('\n Update Context request');
    debug('\n body: ');
    debug(req.body);
    var dev = req.body;

    var context = { "contextElements": [{
        "type": req.body.context.type,
        "isPattern": "false",
        "id": req.body.context.context_id,
        "attributes": req.body.context.attributes
    }],
        updateAction : "UPDATE"
    };



    var url =   UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(context));
    capability.requestToken(url, function (capability_token){

        http_post(url, context, capability_token, function(statusCode, response){
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));
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
    var type = req.body.type;
    var context = {
        "contextElements": [{
            "id": id,
            "type": type,
            "isPattern": "false"
        }],
        "updateAction": "DELETE"
    };

    debug("Context Manager deleteContext");
    var url =   UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/updateContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(context));
    /**/
    capability.requestToken(url, function (capability_token){

        http_post(url, context, capability_token, function(statusCode, response){
            debug("Code response from Context Manager: " + statusCode);
            debug("Response body: " + JSON.stringify(response));
            if(response.error !== undefined && response.error == 401) res.send({message: "Context Manager not available: Unauthorized "});
            res.send({success: true});
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




exports.discovery_POST = function (req, res) {
    debug('\n New discovery context request');

    var data =  {"entities":
        [{"type": "",
            "isPattern": "true",
            "id": "SocIoTal:*"}],
        "attributes": req.body.attributes
    };

    debug("seach body: ");
    debug(data);

    var url =  UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/queryContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(data);

    capability.requestToken(url, function (capability_token){
        http_post(url, data, capability_token, function(statusCode, response){
            debug("ContextBrocker discovery");
            debug("status code response : " + statusCode);
            //debug("response body: " + JSON.stringify(response));
            if(response.error !== undefined && response.error === 401) res.send({message: "Context Manager not available: Unauthorized "});

            var result = [];
            if(statusCode == 200 && response.contextResponses !== undefined) {
                response.contextResponses.forEach(function(element){
                    result.push(element.contextElement);

                });
                res.send({elements: result});
            } else {
                res.send({elements: "No contexts found!!"});
            }
        });
    });
};


exports.subscribe = function(form_data, onResult){
    debug("Context Manager subscribeContext");

    var base_url =  "https://" +  form_data.hostname + ":" + config.port;
    var reference = base_url + "/api/channels/" + form_data.channel_id + "/receive";
    console.log(form_data);

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

    var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/subscribeContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(JSON.stringify(data));

    capability.requestToken(url, function (capability_token) {
        http_post(url, data, capability_token, onResult);
    });
};

exports.unsubscribe = function(data, onResult){
    debug("Context Manager unsubscribeContext");

    var url =   UCSERVER.protocol +  UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_NGSI10 + "/unsubscribeContext";
    debug("the url is: " + url);
    debug("data to send: " );
    debug(data);

    capability.requestToken(url, function (capability_token) {
        http_post(url, data, capability_token, onResult);
    });
};




function http_post(_url, _data, capability_token, _cb){
    var obj;

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
            debug('ERROR in http post:', err);
            _cb(505, err);
        });
        // post the data
        req.write(JSON.stringify(_data));
        req.end();
    } else {
        //protocol is https:
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
            debug('ERROR in http post:', err);
            _cb(505, err);
        });
        // post the data
        req.write(JSON.stringify(_data));
        req.end();

    }

/*
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
 */
}

exports.genCapabilityToken = function (req, res) {
    var options = req.body;
    options.idm_id = req.user.idm_id;
    options.idm_token = req.user.idm_token;
    debug(options)
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
    var capabilityV3 = require("./security-manager/capability/capabilityV3.js");
    capabilityV3.getCapabilityToken(options, function(error, response){
        if(error !== undefined)
            res.send(500, response);
        else
            res.send(200, response);
    })
};

