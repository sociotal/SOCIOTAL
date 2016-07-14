var debug = require('debug')('models:ThirtyBoxesChannel');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel = require('./channel');
//var ChannelSchema = channel.ChannelSchema;


var ThirtyBoxesChannelSchema = ChannelSchema.extend({

  thirtyBoxesChannelID:String,
  apiKey: String,
  authorizedUserToken: String,
  t_event: String,
  format: {type:String, default:"json"},

});

ThirtyBoxesChannelSchema.statics.actionDictionary = [
  {id: "addEventAction", label : "Add Event", default: 210, type: "" },
];


ThirtyBoxesChannelSchema.methods.addEventAction = function(val, event, check){
    debug("executing addEventAction");
    debug("check is "+check);

    this.addByOneBox(function (statusCode,result){
      debug("status:"+statusCode);
      //debug("result:"+JSON.stringify(result));

      if(statusCode===200)
            debug("Event Added");

      });
};



// this method is invoked by UI Run command ONLY
ThirtyBoxesChannelSchema.methods.taskRun = function(pubsubBroker){
    debug("30Box channel running");
    debug("connecting to 30Box ...");
    var res;

    this.addByOneBox(function (statusCode,result){
      debug("status:"+statusCode);
      //debug("result:"+JSON.stringify(result));

      if(statusCode===200)
            debug("Event Added");

      });


};



var http = require("http");
var https = require("https");
var url = require("url");





ThirtyBoxesChannelSchema.methods.addByOneBox = function(onResult)
{
    debug("30boxes::add event call");
    debug(this.apiKey);
    debug(this.authorizedUserToken);
    debug(this.t_event);

    // self is the "this" object. used to avoid the scope issues.
    self = this;
    var port = https;
    var obj;
    var url_path= '/api/api.php?method=events.AddByOneBox&apiKey='+this.apiKey+'&authorizedUserToken='+this.authorizedUserToken+'&event='+encodeURIComponent(this.t_event);
    var options = {
      host:"30boxes.com",
      port:443,
      path:url_path,
      method:"GET",
      headers:{}
    };

    debug(url_path);

    var req = port.request(options, function(res)
    {
        var output = '';
        debug(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            debug(output);

            // obj = JSON.parse(output);
            // debug("req: " + JSON.stringify(obj));
            var time = new Date();
            // self.inbox.push({date_created: time, payload: obj});     // save new data inside inbox
            // self.save();              // save inside db
            onResult(res.statusCode, {date_created: time, payload: "test"});
        });

    });

    debug("this.title:" + this.title);


    req.on('error', function(err) {
        debug(options.host + ':' + err);
    });

    req.end();
};



/**
 * AuthTokenCall:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
// ThirtyBoxesChannelSchema.methods.authToken = function(onResult)
// {
//     debug("30boxes::auth token call");
//     debug(this.apiKey);
//     debug(this.authorizedUserToken);
//     debug(this.t_event);

//     // self is the "this" object. used to avoid the scope issues.
//     self = this;

//     var applicationLogoUrl = 'http://localhost:3000/img/sociotal_logo.png';
//     var returnUrl = 'http://localhost:3000/channels/form/ThirtyBoxesChannel/authorized';
//     var applicationName = 'SocIoTal';
//     var apiKey = '8464726-962ce1a28d677663b0ff168f7d7c7103';

//     var port = https;
//     var obj;
//     var url_path= '/api/api.php?method=user.Authorize&apiKey='+apiKey+'&applicationName='+applicationName+'&applicationLogoUrl='+applicationLogoUrl+'&returnUrl='+returnUrl;
//     var options = {
//       host:"30boxes.com",
//       port:443,
//       path:url_path,
//       method:"GET",
//       headers:{}
//     };

//     debug(url_path);

//     res.redirect(options.host+url_path);

//     // var req = port.request(options, function(res)
//     // {
//     //     var output = '';
//     //     debug(options.host + ':' + res.statusCode);
//     //     res.setEncoding('utf8');

//     //     res.on('data', function (chunk) {
//     //         output += chunk;
//     //     });

//     //     res.on('end', function() {
//     //         debug(output);

//     //         // obj = JSON.parse(output);
//     //         // debug("req: " + JSON.stringify(obj));
//     //         var time = new Date();
//     //         // self.inbox.push({date_created: time, payload: obj});     // save new data inside inbox
//     //         // self.save();              // save inside db
//     //         onResult(res.statusCode, {date_created: time, payload: "test"});
//     //     });

//     // });

//     debug("this.title:" + this.title);


//     req.on('error', function(err) {
//         debug(options.host + ':' + err);
//     });

//     req.end();
// };






mongoose.model('ThirtyBoxesChannel', ThirtyBoxesChannelSchema);
