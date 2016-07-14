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


var body = {
    "resource" : "https://193.144.201.50:3501/SocIoTal_CM_REST_V3/NGSI10_API/queryContext",
    "ngsi_action": "queryContext",
    "context_id" : "*"
    ,//"idm_id" : "d96aa41f9293bb95843c8632f059e561eaddb00beb1054c636ee3fbc1c0ce64a",
    //"idm_token" : "253ec28606d94f1587bf50f626b90fb0"
};




describe('Test Request Capability Token API', function(){



    describe('POST /api/capability/generate ', function(){
        var url = endpoint + "/capability/generate?access_token=" + access_token;
        console.log(url)

        var options = {
            url: url,
            body: JSON.stringify(body),
            headers:{"Content-Type": "application/json"}
        };

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            options.url = endpoint + "/capability/generate?access_token=faketoken",

            request.post(options, function (error, response, body) {
                expect(body).to.equal("Unauthorized");
                done()
            });
            options.url = url;
        });

        // it('should respond with a valid capability token',function(done){
        //     request.post(options, function (error, response, body) {
        //         expect(response.statusCode).to.equals(200);
        //         var ct = JSON.parse(body);
        //         console.log(ct);
        //         expect(ct.capabilityToken).not.to.equals(undefined);
        //         expect(ct.capabilityToken.is).not.to.equals(undefined);
        //
        //         done()
        //     });
        //
        // });


        //
        //it('should not create a new PHONE channel and return 400 for bad request: channel_type not found ',function(done){
        //    // rename the field channel_type to force the error
        //    renameField(new_channel, 'channel_type', 'channel_typ');
        //    var options = {
        //        url: url,
        //        body: JSON.stringify(new_channel),
        //        headers:{"Content-Type": "application/json", "Accept": "application/json"}};
        //    request.post(options, function (error, response, body) {
        //        expect(response.statusCode).to.equals(400);
        //        done()
        //    });
        //    // restore the channel_type name
        //    renameField(new_channel, 'channel_typ', 'channel_type');
        //
        //});
        //
        //it('should not create a new PHONE channel and return 400 for bad request: title required ',function(done){
        //    // rename the field channel_type to force the error
        //    renameField(new_channel, 'title', 'ttttt');
        //    var options = {
        //        url: url,
        //        body: JSON.stringify(new_channel),
        //        headers:{"Content-Type": "application/json", "Accept": "application/json"}};
        //    request.post(options, function (error, response, body) {
        //        expect(response.statusCode).to.equals(400);
        //        done()
        //    });
        //    renameField(new_channel, 'ttttt', 'title');
        //});
        //
        //it('should not create a new PHONE channel and return 400 for bad request: registration_id required ',function(done){
        //    // rename the field channel_type to force the error
        //    renameField(new_channel, 'registration_id', 'registration_');
        //    var options = {
        //        url: url,
        //        body: JSON.stringify(new_channel),
        //        headers:{"Content-Type": "application/json", "Accept": "application/json"}};
        //    request.post(options, function (error, response, body) {
        //        expect(response.statusCode).to.equals(400);
        //        done()
        //    });
        //    renameField(new_channel, 'registration_', 'registration_id');
        //});
        //
        //it('should create a new channel and return 201 (created) ',function(done){
        //    request.post(options, function (error, response, body) {
        //        expect(response.statusCode).to.equals(201);
        //        done()
        //    })
        //});



    });

});

function renameField(obj, old, _new){
    obj[_new] = obj[old];
    delete obj[old];
}

