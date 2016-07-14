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
var new_access_token = "H8A0n2KS";




var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://localhost:27017/sociotal_test';
collection = 'channels';
const MAX_ITEMS = 10;

var expect = require('chai').expect;
var should = require('chai').should();
var request = require('request');


var new_channel = { "_id" : '41224d776a326fb40f000001',
    "channel_type": "GenericDeviceChannel",
    "title": "MyTemperature",
    "context": "bed room",
    "unit": "centigrade",
    "description": "this is my temperature sensor in my bed room",
    "tags": "bed, room, sens" };



describe('Channels API at ' + endpoint, function(){

    describe('GET /channels ', function(){
        it('should respond Unauthorized (whit wrong access_token)',function(done){
            var url = endpoint + "/channels" + "?access_token=cwJehUj" ;
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done()
            })
        });

        it('should respond with statusCode 200 ',function(done){
            var url = endpoint + "/channels" + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                done()
            })
        });

        it("should have the property 'channels' ",function(done){
            var url = endpoint + "/channels" + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                _body.should.have.property('channels');
                done()
            })
        });

        it("each channel should have the property 'id' ",function(done){
            var url = endpoint + "/channels" + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body.channels.length > 0){
                    _body.channels.forEach(function(channel){
                        channel.should.have.property('id');
                    });
                }
                done()
            })
        });

        it("each channel should NOT have the property '_id' ",function(done){
            var url = endpoint + "/channels" + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body.channels.length > 0){
                    _body.channels.forEach(function(channel){
                        channel.should.not.have.property('_id');
                    });
                }
                done()
            })
        });
    });


    describe('POST /channels ', function(){

        var url = endpoint + "/channels?access_token=" + access_token;

        var options = {
            url: url,
            body: JSON.stringify(new_channel),
            headers:{"Content-Type": "application/json", "Accept": "application/json"}
        };

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            options.url = endpoint + "/channels?access_token=cwJehUj" ;
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done()
            })
            options.url = url;
        });

        it('should create a new channel and return 201 (created) ',function(done){
            request.post(options, function (error, response, body) {
                expect(response.statusCode).to.equals(201);
                done()
            })
        });

        it('should not create a new channel and return 400 for bad request: channel_type not found ',function(done){
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

        it('should not create a new channel and return 400 for bad request: title required ',function(done){
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


        // it('new channel should have property attributes',function(done){
        //     // check for a valid sociotal_id at http://sociotal.crs4.it/devices/discovery
        //     var socio_channel = {
        //         "_id" : '41224d776a326fb40f123456',
        //         "channel_type": "SocIoTalChannel",
        //         "sociotal_id" : "SocIoTal:SAN:WeatherStation:Dev_001",
        //         "title": "MyContext",
        //         "context": "bed room",
        //         "unit": "centigrade",
        //         "description": "this is my context sensor from ContextManager",
        //         "tags": "ContextManager, centigrade, room"
        //     };
        //     var options = {
        //         url: url,
        //         body: JSON.stringify(socio_channel),
        //         headers:{"Content-Type": "application/json", "Accept": "application/json"}
        //     };
        //     request.post(options, function (error, response, body) {
        //         expect(response.statusCode).to.equals(201);
        //         var u = endpoint + "/channels/" + socio_channel._id + "?access_token=" + access_token;
        //         request(u, function (error, response, body) {
        //             var _body = JSON.parse(body);
        //             expect(response.statusCode).to.equals(200);
        //             _body.channel.should.have.property('attributes');
        //
        //             var _url = endpoint + "/channels/" + socio_channel._id + "?access_token=" + access_token;
        //             request.del(_url, function (error, response, body) {
        //                 expect(response.statusCode).to.equal(200);
        //                 done();
        //             })
        //         });
        //     });
        //});
    });


    describe('PUT /channels/:channel_id ', function(){

        // PUT url
        var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;
        var channel = { "channel_type": "GenericDeviceChannel",
            "title": "MyTemperature",
            "context": "bed room",
            "unit": "centigrade",
            "description": "this is my temperature sensor in my bed room",
            "tags": "bed, room, sens"
        };
        var options = {
            url: url,
            method : 'PUT',
            body: JSON.stringify(channel),
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

        it('should respond Unauthorized (whit different channel_id and access_token)',function(done){
            //http://localhost:3000/api/channels/jfdslfjdlskfjdlsjf?=access_token=jfjfjdls
            options.url = options.url.split("=")[0] + "=" + new_access_token;

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
            channel_id = 205673;
            options.url = endpoint + "/channels/" + channel_id + "?access_token=" + access_token;
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done()
            })
            options.url = url;
        });

        it('should not update the channel and return 400 for bad request: channel_type not found ',function(done){
            // rename the field channel_type to force the error
            renameField(channel, 'channel_type', 'channel_typ');
            var options = {
                url: url,
                method:'PUT',
                body: JSON.stringify(channel),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}
            };
            request(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            // restore the channel_type name
            renameField(channel, 'channel_typ', 'channel_type');

        });

        it('should not update the channel and return 400 for bad request: title required ',function(done){
            // rename the field channel_type to force the error
            renameField(channel, 'title', 'ttttt');
            var options = {
                url: url,
                method:'PUT',
                body: JSON.stringify(channel),
                headers:{"Content-Type": "application/json", "Accept": "application/json"}
            };
            request.put(options, function (error, response, body) {
                expect(response.statusCode).to.equals(400);
                done()
            });
            renameField(channel, 'ttttt', 'title');
        });
    }); // end PUT /channels/:channel_id



    describe('GET /channels/:channel_id ', function(){

        var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            _url = url.substring(0, url.length-2);
            request(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            })
        });

        it('should respond with statusCode 200 ',function(done){
            var url = endpoint + "/channels" + "?access_token=" + access_token;
            request(url, function (error, response, body) {
                expect(response.statusCode).to.equals(200);
                done();
            })
        });

        it('should respond channel not found 404',function(done){
            channel_id = 205673;
            var _url = endpoint + "/channels/" + channel_id + "?access_token=" + access_token;
            request(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done();
            })
        });

        it("channel should have the property 'id' ",function(done){
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.channel.should.have.property('id');

                done();
            })
        });

        it("channel should NOT have the property '_id' ",function(done){
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.channel.should.not.have.property('_id');
                done();
            })
        });
    });

    describe('GET /channels/:channel_id DATA', function(){

        var url = endpoint + "/channels/" + new_channel._id + "/data?access_token=" + access_token ;

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

        it('should respond channel not found 404',function(done){
            var channel_id = 205673;
            var _url = endpoint + "/channels/" + channel_id + "/data?access_token=" + access_token + "&limit=2&skip=0";
            request(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done();
            })
        });

        it("channel should have the property 'results' ",function(done){
            var url = endpoint + "/channels/" + new_channel._id + "/data?access_token=" + access_token + "&limit=2&skip=0";
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.should.have.property('results');

                done();
            })
        });

        it("channel should have the property '_metadata' ",function(done){
            var url = endpoint + "/channels/" + new_channel._id + "/data?access_token=" + access_token + "&limit=2&skip=0";
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body.should.have.property('_metadata');

                done();
            })
        });

        it("channel should have the property '_metadata.limit=2' ",function(done){
            var url = endpoint + "/channels/" + new_channel._id + "/data?access_token=" + access_token + "&limit=2&skip=0";
            request(url, function (error, response, body) {
                var _body = JSON.parse(body);
                if(_body)
                    _body._metadata.should.have.property("limit").equals(2);

                done();
            })
        });
    });

    describe('DELETE /channels/:channel_id ', function(){

        var url = endpoint + "/channels/" + new_channel._id + "?access_token=" + access_token;

        it('should respond Unauthorized (whit wrong access_token)',function(done){
            _url = url.substring(0, url.length-2);
            request.del(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(401);
                done();
            })
        });

        it('should respond channel not found 404',function(done){
            channel_id = 205673;
            var _url = endpoint + "/channels/" + channel_id + "?access_token=" + access_token;
            request.del(_url, function (error, response, body) {
                expect(response.statusCode).to.equal(404);
                done();
            })
        });

        it('should respond with statusCode 200 ',function(done){
            request.del(url, function (error, response, body) {

                expect(response.statusCode).to.equals(200);
                console.log("");
                done();
            })
        });

        //it('should respond with statusCode 200 ',function(done){
        //    done();
        //});

    }); // end DELETE channel

}); // end Channel API

function renameField(obj, old, _new){
    obj[_new] = obj[old];
    delete obj[old];
}
