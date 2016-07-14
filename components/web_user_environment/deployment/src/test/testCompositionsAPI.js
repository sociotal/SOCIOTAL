// This file test the Sociotal API /channels
//
// To run
// 1) change endpoint variable with a valid server name ES:
//      * http://localhost:3000
//      * http://lbsdev.crs4.it
//      * https://lbsdev.crs4.it
//      * http://sociotal.crs4.it
//      * https://sociotal.crs4.it
// 2) change access_token variable with a valid token related to a user existing in the server


var protocol = "http";
var servername = "sociotal.crs4.it";
var endpoint = protocol + '://' + servername + '/api';
var access_token = "5Vr2dRxZ";  // lbsdev.crs4.it = fqLVMUdD; sociotal.crs4.it = 02eDcZ5r



var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;

var expect = require('chai').expect;
var should = require('chai').should();
var request = require('request');


var new_channel = { "_id" : '41224d776a326fb40f000001',
    "channel_type": "DebugChannel",
    "title": "TEST_CHANNEL_MOCHA",
    "context": "bed room",
    "unit": "centigrade",
    "description": "this is my temperature sensor in my bed room",
    "tags": "bed, room, sens" };


var new_composition = {
    _id: '56a8e156fcc715dc0a4b1f7b',
    "trigger": {
        "attribute": "Speed",
        "name": "greaterThan",
        "check": "56"
    },
    "action":
    {
        "targetChannelId": "54d38e928ae5cd360fc3ec23",
        "actionName": "consoleAction",
        "arg": "you are driving nicely!!!"
    },
    "label": "WHEN Speed greater than 56 DO mydebug.consoleAction('you are driving nicely!!!')"

};

describe('Compositions API at ' + endpoint, function(){


    before(function(done){
        // create channel

        var url = endpoint + "/channels?access_token=" + access_token;

        var options = {
            url: url,
            body: JSON.stringify(new_channel),
            headers:{"Content-Type": "application/json", "Accept": "application/json"}
        };

        request.post(options, function (error, response, body) {
            done()
        })
    });

    after(function(done){
        // delete channel
        var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;
        request.del(url, function (error, response, body) {

            //expect(response.statusCode).to.equals(200);
            console.log("");
            done();
        })
    });


    describe('POST /channels/' + new_channel._id + '/compositions', function(){
        var url = endpoint + '/channels/' + new_channel._id + '/compositions?access_token=' + access_token ;
        var options = {
            url: url,
            body: JSON.stringify(new_composition),
            headers:{"Content-Type": "application/json", "Accept": "application/json"}
        };

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            var url = endpoint + '/channels/' + new_channel._id + '/compositions?access_token=cwJehUj' ;
            var options = {
                url: url,
                body: JSON.stringify(new_composition),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}
            };

            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(401);
                done()
            })
        });

        it('should not save the composition and return 400 for bad request: trigger not found ',function(done){
            // rename the field channel_type to force the error
            renameField(new_composition, 'trigger', 'trigge');
            var options = {
                url: url,
                body: JSON.stringify(new_composition),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}};

            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });

            // restore the channel_type name
            renameField(new_composition, 'trigge', 'trigger');
        });

        it('should not save the composition and return 400 for bad request: action not found ',function(done){
            // rename the field channel_type to force the error
            renameField(new_composition, 'action', 'actio');
            var options = {
                url: url,
                body: JSON.stringify(new_composition),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}};
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            // restore the channel_type name
            renameField(new_composition, 'actio', 'action');
        });
        it('should create a new composition and return 201 (created) ',function(done){
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(201);
                done()
            })
        });
    }); // end describe POST

    describe('GET - LIST /channels/' + new_channel._id + '/compositions', function(){
        var url = endpoint + '/channels/' + new_channel._id + '/compositions?access_token=' + access_token ;

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            var url = endpoint + '/channels/' + new_channel._id + '/compositions?access_token=cwJehUj' ;
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(401);
                done()
            })
        });
        it('should respond with statusCode 200',function(done){
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                var _body= JSON.parse(body);
                done()
            })
        });

    }); // end GET LIST compositions

    describe('GET - SINGLE /channels/' + new_channel._id + '/compositions/' + new_composition._id , function(){

        var url = endpoint + "/channels/" + new_channel._id + "/compositions/" + new_composition._id +  "?access_token=" + access_token;

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            _url = url.substring(0, url.length-2);
            request(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            })
        });

        it('should respond with statusCode 200 ',function(done){
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                done();
            })
        });

        it('should respond composition not found 404',function(done){
            var comp_id = 205673;
            var _url = endpoint + "/channels/" + new_channel._id + "/" + comp_id +  "?access_token=" + access_token;
            request(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done();
            })
        });

        it("response should have the property 'id' ",function(done){
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.composition.should.have.property('id');

                done();
            })
        });

        it("response should NOT have the property '_id' ",function(done){
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.composition.should.not.have.property('_id');
                done();
            })
        });
    });

    describe('PUT /channels/' + new_channel._id + '/compositions/' + new_composition._id, function(){

        // PUT url
        var url = endpoint + "/channels/" + new_channel._id + "/compositions/" + new_composition._id +  "?access_token=" + access_token;

        var comp = {
            "trigger": {
                "attribute": "Speed",
                "name": "greaterThan",
                "check": "90"
            },
            "action":
            {
                "targetChannelId": "54d38e928ae5cd360fc3ec23",
                "actionName": "consoleAction",
                "arg": "you are too fast!!!"
            },
            "label": "WHEN Speed greater than 90 DO mydebug.consoleAction('you are too fast!!!')"

        };
        var options = {
            url: url,
            method : 'PUT',
            body: JSON.stringify(comp),
            headers:{"Content-Type": "application/json", "Accept": "application/json"}
        };


        it('should respond Unauthorized (whit wrong access_token)',function(done){
            options.url = options.url.substring(0, options.url.length-2);
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done()
            });
            options.url = url;
        });

        it('should successfully updated statusCode 200',function(done){
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equal(200);
                done()
            })
        });

        it('should respond channel not found 404',function(done){
            comp_id = 205673;
            options.url = endpoint + "/channels/" + new_channel._id + "/compositions/" + comp_id +  "?access_token=" + access_token;
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done()
            })
            options.url = url;
        });

        it('should not update the composition and return 400 for bad request: trigger not found ',function(done){
            // rename the field channel_type to force the error
            renameField(comp, 'trigger', 'trigge');
            var options = {
                url: url,
                method:'PUT',
                body: JSON.stringify(comp),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}
            };
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            // restore the channel_type name
            renameField(comp, 'trigge', 'trigger');

        });

        it('should not update the channel and return 400 for bad request: action required ',function(done){
            // rename the field channel_type to force the error
            renameField(comp, 'action', 'actio');
            var options = {
                url: url,
                method:'PUT',
                body: JSON.stringify(comp),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}
            };
            request.put(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            renameField(comp, 'actio', 'action');
        });
    }); // end PUT composition

    describe('DELETE /channels/' + new_channel._id + '/compositions/' + new_composition._id , function(){

        var url = endpoint + "/channels/" + new_channel._id + "/compositions/" + new_composition._id +  "?access_token=" + access_token;

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            _url = url.substring(0, url.length-2);
            request.del(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            })
        });

        it('should respond channel not found 404',function(done){
            comp_id = 205673;
            var _url = endpoint + "/channels/" + new_channel._id + "/compositions/" + comp_id + "?access_token=" + access_token;
            request.del(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done();
            })
        });

        it('should respond with statusCode 200 ',function(done){
            request.del(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                done();
            })
        });


    }); // end DELETE channel

}); // end Compositions API

function renameField(obj, old, _new){
    obj[_new] = obj[old];
    delete obj[old];
}
