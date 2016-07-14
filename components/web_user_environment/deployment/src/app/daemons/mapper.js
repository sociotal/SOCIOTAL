var debug = require('debug')('daemons:mapper');
var http = require("http");
var ascoltatori = require('ascoltatori');
var mongoose = require("mongoose");


//Mongoose models
var ChannelSchema = require("../models/channel");
var XivelyChannel = require("../models/xivelyChannel");
var DebugChannelSchema = require("../models/debugChannel");
var ThirtyBoxesChannelSchema = require("../models/ThirtyBoxesChannel");


var Channel = mongoose.model("Channel");
var XivelyChannel = mongoose.model("XivelyChannel");
var DebugChannel = mongoose.model('DebugChannel');
var ThirtyBoxesChannel = mongoose.model("ThirtyBoxesChannel");



var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

// --- Bootstrap db connection
// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

// Error handler
mongoose.connection.on('error', function (err) {
  debug(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect();
});
// ---





//ascoltatori init
var ascoltatore;

var settings = {
		  type: 'mongo',
		  url: config.db,
		  pubsubCollection: 'ascoltatori',
		  mongo: {} // mongo specific options
		};



function onMsg(){

	var msg = arguments["1"];
    debug("RECEIVED msg: " + JSON.stringify(msg));
    var targetChannelId = msg.channelId;
    var actionName = msg.actionName;
    var arg = msg.arg;

    Channel.findById(targetChannelId, function (err, channel) {

    							if(!err){
    								//invoke action method on target Channel
    								channel[actionName](arg);
    							}
    							else{
    								debug("No Channel found with id: %s", targetChannelId);
    							}


    });


}


function done(){
	    debug("Subscribed to Channel %s", config.connectionPubSubTopic);
}


ascoltatori.build(settings, function (ascoltatore) {
  // subscribes to a topic
  ascoltatore.subscribe(config.connectionPubSubTopic, onMsg, done);
});





http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Sociotal Mapper v.1.0 running");
  response.end();
}).listen(8888);
