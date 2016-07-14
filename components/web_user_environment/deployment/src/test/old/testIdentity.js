var pem = require('pem');
var fs = require('fs');
var should = require('chai').should() //actually call the function

var cert = require("../app/controllers/security-manager/certificates/certificates.js");

var user = {
    "active" : false,
    "activationToken" : "C80IzOYzpQTvvn21ENVs7P0pSMljb41t",
    "android_registration_id" : "",
    "devices" : [],
    "online" : false,
    "authToken" : "WxulEjbG",
    "salt" : "170043680183",
    "image" : "/img/test_profile.jpeg",
    "hashed_password" : "c565d596f2d24bbaf3ead10cb1c6d42b787f2ab8",
    "provider" : "local",
    "username" : "username",
    "email" : "albes.mail@gmail.com",
    "name" : "TestUser"
};

var project_root = "/Users/labgw01/projects/sociotal";
var crt_file = project_root + '/app/controllers/security-manager/certificates/users/' + user.email + ".crt";
var crt_validity = 500;
var crt_content = null;


describe('Certificates test', function(){
    before(function(done){
        cert.generateUserCertificates(user, function(){
            fs.readFile(crt_file, function(err,data){
                if (!err){
                    pem.readCertificateInfo(data, function (err, certificate) {
                        if (!err) {
                            crt_content = certificate


                        } else
                            console.log(err);
                        done();
                    });
                }else{
                    console.log(err);
                }
            });
        });
    });

    //after(function(done){
    //    fs.unlink(crt_file, function(){
    //        done();
    //    });
    //});

    describe("Certificate user information", function(done){
        it('email should be equals to ' + user.email, function (done) {
            crt_content.should.have.property("emailAddress").equals(user.email);
            done();
        });

        it('common name should be equals to ' + user.username, function (done) {
            crt_content.should.have.property("commonName").equals(user.username);
            done();
        });

        it('validity should be 500 days ', function (done) {
            timeDifference(crt_content.validity.start, crt_content.validity.end, function(days){
                crt_validity.should.equals(days);
                done();
            });
        });


    });
    describe("Certificate issuer", function(done){
        it('country issuer should be SP', function (done) {
            crt_content.issuer.should.have.property("country").equals("SP");
            done();
        });

        it('state issuer should be SPAIN', function (done) {
            crt_content.issuer.should.have.property("state").equals("SPAIN");
            done();
        });

        it('organization issuer should be UMU', function (done) {
            crt_content.issuer.should.have.property("organization").equals("UMU");
            done();
        });

        it('organizationUnit issuer should be DIIC', function (done) {
            crt_content.issuer.should.have.property("organizationUnit").equals("DIIC");
            done();
        });

        it('commonName issuer should be inf.um.es', function (done) {
            crt_content.issuer.should.have.property("commonName").equals("inf.um.es");
            done();
        });
    });


})

function timeDifference(date1, date2, callback ) {
    var difference = date2 - date1 ;

    var daysDifference = Math.floor(difference/1000/60/60/24);
    //difference -= daysDifference*1000*60*60*24

    //var hoursDifference = Math.floor(difference/1000/60/60);
    //difference -= hoursDifference*1000*60*60
    //
    //var minutesDifference = Math.floor(difference/1000/60);
    //difference -= minutesDifference*1000*60
    //
    //var secondsDifference = Math.floor(difference/1000);

//    console.log('difference = ' + daysDifference + ' day/s ' + hoursDifference + ' hour/s ' + minutesDifference + ' minute/s ' + secondsDifference + ' second/s ');
    callback(daysDifference);
}