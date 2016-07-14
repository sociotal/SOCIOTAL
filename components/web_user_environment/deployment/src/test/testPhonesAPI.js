// This file test the Sociotal API /channels
//
// This step as first step create a mongodb called sociotal-test and populate the collection 'channels' with MAX_ITEMS
// and a fake user in the users collection.
//
// To run
// 1) run mongod
// 2) change config/config.js to point mongoose connection to sociotal_test
// 3) run sociotal server.js (node server.js)
// 4) start test with mocha test/testChannelsAPI.js


var protocol = "http";
var servername = "sociotal.crs4.it";
var endpoint = protocol + '://' + servername + '/api';
var access_token = "5Vr2dRxZ";  // lbsdev.crs4.it = fqLVMUdD; sociotal.crs4.it = 02eDcZ5r




var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://localhost:27017/sociotal_test';
collection = 'channels';
const MAX_ITEMS = 10;

var expect = require('chai').expect;
var should = require('chai').should();
var request = require('request');


var user = {
    "_id" : ObjectId("563c747ece1746362ca17633"),
    "active" : true,
    "activationToken" : "uGYqqAY02o1rVPF9BZOSGeHc9gH04syb",
    "android_registration_id" : "",
    "devices" : [],
    "online" : false,
    "authToken" : "0y2PVbx3",
    "salt" : "1392077615090",
    "image" : "/image/test_profile.jpeg",
    "hashed_password" : "f93c2e1a1f06684e6fcdb35002a3082d8a1d4a6f",
    "provider" : "local",
    "username" : "test",
    "email" : "test@social.eu",
    "name" : "Test",
    "__v" : 0
};

var new_channel = {
    "_id" : "563c747ece1746362ca17633",
    "title": "MYPhone",
    "registration_id": "APA91bE4hBb6etVam3-M8o04zewWDhn0eq04tIYpUNUtGsF5eEVyWsrFWD1QrRc2sn_qXRdl0lsBRc8FTyKUDekAqraUqkmCriMkMLGYSFlCdJMl9KQKu1Q",
    "channel_type": "PhoneChannel"
};



describe('Smartphone registration API', function(){

    after(function(done){
        // delete channel
        var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;
        request.del(url, function (error, response, body) {
            done();
        })
    });


    describe('POST /users/devices/register ', function(){
        var url = endpoint + "/users/devices/register?access_token=" + access_token;


        var options = {
            url: url,
            body: JSON.stringify(new_channel),
            headers:{"Content-Type": "application/json", "Accept": "application/json"}
        };

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            options.url = endpoint + "/users/devices/register?access_token=sdfcese",

            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done()
            });
            options.url = url;
        });



        it('should not create a new PHONE channel and return 400 for bad request: channel_type not found ',function(done){
            // rename the field channel_type to force the error
            renameField(new_channel, 'channel_type', 'channel_typ');
            var options = {
                url: url,
                body: JSON.stringify(new_channel),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}};
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            // restore the channel_type name
            renameField(new_channel, 'channel_typ', 'channel_type');

        });

        it('should not create a new PHONE channel and return 400 for bad request: title required ',function(done){
            // rename the field channel_type to force the error
            renameField(new_channel, 'title', 'ttttt');
            var options = {
                url: url,
                body: JSON.stringify(new_channel),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}};
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            renameField(new_channel, 'ttttt', 'title');
        });

        it('should not create a new PHONE channel and return 400 for bad request: registration_id required ',function(done){
            // rename the field channel_type to force the error
            renameField(new_channel, 'registration_id', 'registration_');
            var options = {
                url: url,
                body: JSON.stringify(new_channel),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}};
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            renameField(new_channel, 'registration_', 'registration_id');
        });

        it('should create a new channel and return 201 (created) ',function(done){
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(201);
                done()
            })
        });

        it('check if PHONE channel exists',function(done){
            var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                var _body = JSON.parse(body);
                expect(_body.channel.channel_type).to.equals(new_channel.channel_type);
                expect(_body.channel.title).to.equals(new_channel.title);
                done()
            })
        });


    });

});

function renameField(obj, old, _new){
    obj[_new] = obj[old];
    delete obj[old];
}

