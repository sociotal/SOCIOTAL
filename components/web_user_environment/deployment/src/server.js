
/*!
 * Sociotal User Environment
 * Copyright(c) 2014-2015 CRS4
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , passport = require('passport')

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// if test env, load example file
// console.log("nodeenv: " + JSON.stringify(process.env));

var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , mongoose = require('mongoose')
  , Agenda = require('agenda')
  , ascoltatori = require('ascoltatori'),
expressValidator = require('express-validator');
var bodyParser = require('body-parser');


// Bootstrap db connection
// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } }
  mongoose.connect(config.db, options)
}
connect()

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err)
})

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect()
})

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

// bootstrap passport config
require('./config/passport')(passport, config)


/*
//RUN mapper and scheduler processes
console.log('- Starting Mapper process...');
var exec = require('child_process').exec,
    child;

child = exec('node app/daemons/mapper.js',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

console.log('- Starting Scheduler process...');
var exec = require('child_process').exec,
    child;

child = exec('node app/daemons/scheduler.js',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});



//RUN API server process
console.log('- Starting API server process...');
var exec = require('child_process').exec,
    child;

child = exec('node app/daemons/api-server/server.js',
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });

 */
//launch HTTP server

var app = express()
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());

initAgenda();/**/
initAscoltatore();

// Start the app by listening on <port>
var port = process.env.PORT || config.port

//app.listen(port)
var server = app.listen(port);
var io = require('socket.io').listen(server);
io.set('log level', 1);
app.socketio = io;
process.env.socketio = io;

// express settings
require('./config/express')(app, config, passport)

// Bootstrap routes
require('./config/routes')(app, passport)

console.log('Express app started on port '+port)

// expose app
exports = module.exports = app;





function initAgenda(){
    console.log('Configuring Agenda...');
    var agenda = new Agenda({db: { address: config.db.split('//')[1], collection: 'agenda-jobs' }});
    agenda.start();
    // console.log(agenda);
    app.agenda = agenda;
}

var Channel = mongoose.model("Channel");

function initAscoltatore(){

    var settings = {
        type: 'mongo',
        url: config.db,
        pubsubCollection: 'ascoltatori',
        mongo: {} // mongo specific options
    };

    ascoltatori.build(settings, function (newAscoltatore) {
        console.log("Ascoltatore created!");
        app.ascoltatore = newAscoltatore;

        newAscoltatore.subscribe(config.connectionPubSubTopic, function (){

                var msg = arguments["1"];
                console.log("RECEIVED msg: " + JSON.stringify(msg));
                var targetChannelId = msg.channelId;
                var actionName = msg.actionName;
                var arg = msg.arg;

                Channel.findById(targetChannelId, function (err, channel) {
                    if(!err){
                        //invoke action method on target Channel
                        channel[actionName](arg);
                    }
                    else{
                        console.log("No Channel found with id: %s", targetChannelId);
                    }
                });
            },
            function(){
                console.log("Subscribed to Channel %s", config.connectionPubSubTopic);
            }
        );

    });
}

