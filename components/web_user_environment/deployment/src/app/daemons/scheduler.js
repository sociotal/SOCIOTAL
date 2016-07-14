/**
 * The Scheduler run the triggers for all Channels
 */
var debug = require('debug')('daemons:scheduler');
var ascoltatori = require('ascoltatori');
var mongoose = require("mongoose");


var ChannelSchema = require("../models/channel");
var XivelyChannel = require("../models/xivelyChannel");
var DebugChannelSchema = require("../models/debugChannel");
var ThirtyBoxesChannelSchema = require("../models/ThirtyBoxesChannel");

var Channel = mongoose.model("Channel");
var XivelyChannel = mongoose.model("XivelyChannel");
var ThirtyBoxesChannel = mongoose.model("ThirtyBoxesChannel");

var DebugChannel = mongoose.model('DebugChannel');








var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

// Bootstrap db connection
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





//ascoltatori init
var ascoltatore;

var settings = {
		  type: 'mongo',
		  url: config.db,
		  pubsubCollection: 'ascoltatori',
		  mongo: {} // mongo specific options
		};




ascoltatori.build(settings, function (newAscoltatore) {


	ascoltatore = newAscoltatore;



	//run triggers for a channel
	function runChannelTriggers(c, pubsubBroker){

	    c.shotEvent(ascoltatore);
	}


	//main

	setInterval(function(){
		debug("Scheduler --------   running...");
		Channel.find({}, function (err, cs) {
		  		if (err) {
		  			debug("Scheduler.find channels ERROR:" + err );
		  		}
		  		else {
		  			//console.dir(cs);
		  			cs.forEach(function(channel){

		  				try{
		  					runChannelTriggers(channel, ascoltatore);
		  				}catch(ex){
		  					console.error('EXCEPTION', ex + "\n");
		  				}

		  			});
		  		}
		});
	}, 5000);

});
