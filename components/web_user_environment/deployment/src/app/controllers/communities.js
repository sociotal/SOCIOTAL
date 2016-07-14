var debug = require('debug')('controllers:communities');

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

var utils = require('../../lib/utils');
var util = require('util');
var extend = require('util')._extend;
var app = require('../../server');
var url = require('url');
var async = require('async');
var lodash = require('lodash');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

var request = require('request');

var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];
var cmEndpoint = config.contextManager[process.env.CM || 'v1Http'];

var parsedServerURL = url.parse(cmEndpoint);

var UCSERVER = {    protocol: parsedServerURL.protocol + "//",
                    host: parsedServerURL.hostname,
                    port : parsedServerURL.port,
                    basepath_COMM_V1 :  "/SocIoTal_COMM_V1"
               };

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var DOMAIN_NAME = "Default";

var CommunityConstr = mongoose.model('Community');

/**
 * Show
 */

exports.show = function (req, res, next) {

    debug(req.body);
    debug(" MEGA REQUEST ------> " + JSON.stringify(req.query));
    debug("req.path: " + req.path);

    debug("parsedServerURL "+JSON.stringify(parsedServerURL));
    debug("parsedServerURL.pathname "+parsedServerURL.pathname);
    var communityData;
    var data;
    var messageAffiliation = null;

    if (req.query.message != undefined){
      messageAffiliation = req.query.message;
    }

    if (req.query.community_id) {
      communityData = req.query.community_id;
      data = {
        "communityID": communityData
      };
    }else if (req.query.community_name){
      communityData = req.query.community_name;
      data = {
        "communityName": communityData
      };
    }

    var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/getCommunity";


    debug("url is: " + url);
    debug("data to send : " + data);
    debug("user is: " + req.user);


    var options = {
        url: url,
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            requestCert: true,
            rejectUnauthorized: false,
            "Content-Type": 'application/JSON',
            //"Community-Token": community.token,
            "Community-Token": req.user.idm_token,
            "Accept" : "application/json"
        }
    };
    debug("options: " );
    debug(options);

    request(options, function (error, response, _body) {
        debug("body response is: " + _body);
        debug("response.statusCode is: " + response.statusCode);
        if(_body === "Not Found"){
          return next(new Error('not found'));
        }
        var body = JSON.parse(_body);
        var current_community = body.Community;
        debug("Show Community: "+current_community);


        var renderOptions = {
            title: 'Community ' ,
            community: current_community,
            owner : false,
            member : false,
            message : messageAffiliation
        };
        if(current_community.owner.id === req.user.idm_id)
            renderOptions.owner = true;

        res.render('communities/details', renderOptions);

    });
   // });

};

function addCommunityReference(idm_token, communityName){

    requestToken(idm_token, DOMAIN_NAME, communityName, function (error, result) {
        if (error) {
            return {result: "failed"};
        }else if (result){

            var community = {
                community_id : result.values.token.community.id,
                name: result.values.token.community.name,
                token: result.communityToken,
                domain_name: result.values.token.community.domain.name
            };

            debug(JSON.stringify("request returns community: "+JSON.stringify(result)));

            var communityObj = new CommunityConstr(community);
            communityObj.save();

            // req.user.communities.push(community);
            // req.user.save();
            return;
            //res.send({result:"success"});
        }
    });
}


exports.revokeAffiliation = function(req, res){
    debug("in revoke affiliation")

    var communityName = req.param("community_name");

    getCommunityToken(req.user.idm_token, communityName, DOMAIN_NAME, function(error, communityToken) {
        debug("result error " + error)
        debug("result ");
        debug("result communityToken " + communityToken);

        var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/autoRemove";

        var options = {
            url: url,
            method: 'DELETE',
            headers: {
                "Community-Token": communityToken
            }
        };
        debug("options");
        debug(options);
        request(options, function (error, response, _body) {
            debug("revoke affiliation error " + error);
            debug("revoke affiliation _body " + _body);
            debug("revoke affiliation response " + response.statusCode); //204 No content

            if(!error)
                res.send({removed : true});
            else
                res.send({removed : false, message : ""});
        });

    });

};

exports.requestAffiliation = function(req, res){
    debug("in request affiliation")
    debug(req.body);
    var communityId = req.param("community_id");
    var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/getCommunity";
    var data = {
        "communityID": communityId
    };

    debug("url is: " + url);
    debug("data to send : " + data);

    var options = {
        url: url,
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            "Community-Token": req.user.idm_token,
            "Content-Type": 'application/JSON',
            "Accept": "application/json",
            "requestCert": true,
            "rejectUnauthorized": false
        }
    };

    request(options, function (error, response, _body) {
        debug("body response is: " + _body);
        var body = JSON.parse(_body);
        var current_community = body.Community;

        var communityName = current_community.name;
        var ownerId = current_community.owner.id;
        var ownerName = current_community.contact.name;
        var ownerMail = current_community.contact.email;

        var userName = req.user.name;
        var userID = req.user.idm_id;
        var protocol = (process.env.NODE_ENV === 'virtualMachine')? "http" : req.protocol;


        var mailOptions = {
            to: ownerMail,
            from: 'SocIoTal team <sociotal-team@crs4.it>',
            subject: 'SocIoTal request community affiliation',
            text: 'Hi ' + ownerName + ',\n\n' +
            'you are receiving this e mail because ' + userName + ' requested to join your community named' + communityName + '.\n\n' +

            //'Agree: ' + 'https://' + req.headers.host + '/communities/' + communityId + '/add/' + userID +
            'To agree use this link: ' + protocol + '://' + req.headers.host + '/communities/' + communityId + '/add/' + userID + "?community_name="+communityName +

            '\n\nIf you not agree, please ignore this email.\n\n' +
            'Best regards!'
        };
      
        debug("mailoptions ")
        debug(mailOptions)
        var transporter = nodemailer.createTransport(smtpTransport(config.smtpTransportOptions));

        transporter.sendMail(mailOptions, function (err) {
              if(err) res.status(500).send(err);

              res.status(200).send({message: "request send to community owner"})
        });
    });

}

exports.add = function(req, res){
    debug("in add user to community")
    debug("community_id: " + req.params.community_id);
    debug("user to add to community: " + req.params.user_id);

    debug("Adding a user to the community (assignRole)")
    var communityId = req.param("community_id");
    var communityName = req.param("community_name");
    var memberId = req.param("member_id");
    debug("communityId: ")
    debug(communityId)

    // CommunityConstr.findOne({community_id : communityId}, function(error, community){

    getCommunityToken(req.user.idm_token, communityName, DOMAIN_NAME, function(error, communityToken) {
      // debug("error ")
      // debug(error)
      //
      // debug("rcommunity ")
      // debug(community)
      //
      // var communityToken = community.token;
      debug("communityToken: " + communityToken);
      listRoles(communityToken, function (error, _roles) {
        var role = _roles.roles.filter(function (item) {
          return item.name === "member"
        });


        var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/assignRole";
        var data = {
          "userId": memberId,
          "roleId": role[0].id  //"1b7377775e354d65aa464a8cdd727d5e" // role member
        };

        var options = {
          url: url,
          method: 'PUT',
          body: JSON.stringify(data),
          headers: {
            "Community-Token": communityToken, // not work with idm_token Must be a valid community-token
            "Content-Type": "application/JSON",
            "Accept": "application/json",
            "requestCert": true,
            "rejectUnauthorized": false
          }
        };
        debug("url is: " + url);
        debug("options to send : ");
        debug(options);

        request(options, function (error, response, _body) {

          var body;
          var message;

          try{
            body = JSON.parse(_body);
          }catch (exception) {
            message = "You are unauthorized to add this user to the community "+communityName;
            res.redirect("/communities/show?community_name="+communityName+"&message="+message);
          }

          if (body != undefined){
              debug("res response is: " + JSON.stringify(body));
              debug("error response is: " + error);
              message = "User "+body.user.userName+" successfully added to the community "+body.community.name;
              res.redirect("/communities/show?community_name="+communityName+"&message="+message);
          }else{
              debug("error response is: " + body);
              // res.redirect("/communities/show?community_name="+communityName)
              message = "You are unauthorized to add this user to the community "+communityName;
              res.redirect("/communities/show?community_name="+communityName+"&message="+message);
          }


        });
      })
    });
    // });
}
var async = require("async");


exports.listUsers = function(req, res){
    debug("in listUsers community")
    var communityName = req.param("community_name");


    getCommunityMembers(req.user.idm_id, req.user.idm_token, communityName, function(statusCode, result){
      res.status(statusCode).send(result);
    });


};



function getCommunityMembers(idm_id, idm_token, communityName, cb){

  getCommunityToken(idm_token, communityName, DOMAIN_NAME, function(error, communityToken){
    if (!error && communityToken && communityToken != "undefined") {
      debug("\n\n---------------------------------------------------------------- communityToken: " + communityToken);
      var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/listUsers";

      var options = {
        url: url,
        method: 'GET',
        headers: {
          "Community-Token": communityToken, // not work with idm_token Must be a valid community-token
          "Content-Type": 'application/JSON',
          "requestCert": true,
          "rejectUnauthorized": false
        }
      };

      debug("url is: " + url);
      debug("options to send : ");
      debug(options);

      request(options, function (error, response, _body) {
        if (!error) {
          debug("body: " + _body);

          if (_body === "Not Found") {
            getCommunityToken(idm_token, community.name, community.domain_name, function (result) {
              debug("result getCommunityToken")
              debug("result result " + result)
              debug("result typeof " + typeof result)

              cb(500, {message: "Error while getting community members"});

              // res.status(500).send({message: "Error while getting community members"})

            });
          } else {
            var body = JSON.parse(_body);
            var members = [];
            async.each(body.Users,
              function (user, callback) {
                // if (user.role.name !== "owner") {
                debug("user: "+JSON.stringify(user));
                var tmp = {
                  idm_id: user.user.id,
                  name: user.user.userName,
                  role: user.role.name,
                  email: user.user.email
                };
                members.push(tmp);
                // }
                callback();
              },
              function (err) {
                var member = members.filter(function (mem) {
                  return mem.idm_id === idm_id;             ///////////////PLEASE CHECK prima era re.body.idm_id perché?
                });
                var revoke = (member.length > 0) ? true : false;
                debug("list members response: ");
                debug({members: members, revoke: revoke});

                cb(200,{members: members, revoke: revoke} );

                // res.status(200).send({members: members, revoke: revoke})
              }
            );
          }
        } else {
          cb(500,{message: "Error while getting community members"});

          // res.status(500).send({message: "Error while getting community members"})
        }
      });
    } else {
      cb(200,{members: [], revoke: false, message: "Maybe you are not authorized to view community info."});

      // res.status(200).send({members: [], revoke: false, message: "Maybe you are not authorized to view community info."})          //***************************************************** e' errore 401 ma per adesso rimane così
    }
  });

}
exports.getCommunityMembers = getCommunityMembers;


































exports.getUserInfoByID = function (req, res,owner_id,  _cb){

  var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/USERS/getUserInfobyID/"+owner_id;
  debug("url is: " + url);
  

  var options = {
    url: url,
    method: 'GET',
    headers: {
      requestCert: true,
      rejectUnauthorized: false,
      'Content-Type': 'application/JSON',
      'Community-Token': req.user.idm_token
    }
  };
  request(options, function (error, response, body) {

    debug("error response is: " + error);
    debug("body response is: " + body);
    debug("response response is: " + response.statusCode);

    if (response.statusCode == 401)
      _cb(null);

    if (body == "Not Found") {
      _cb(null);
    } else {
      var user = JSON.parse(body)["user"];
      _cb(user);
    }
  });


}


exports.count = function(req, res, next){
        var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/list";

        debug("url is: " + url);
        ////debug("user is: " + req.user);

        var options = {
            url: url,
            method: 'GET',
            headers: {
                requestCert: true,
                rejectUnauthorized: false,
                'Content-Type': 'application/JSON',
                //'Community-Token': community.token,
                'Community-Token': req.user.idm_token
            }
        };

        request(options, function (error, response, body) {

            debug("error response is: " + error);
            debug("body response is: " + body);
            debug("response response is: " + response.statusCode);

            if(response.statusCode == 401)
                return next(new Error('idm_token_expired'));

            if(body == "Not Found")
                return next(new Error('idm_token_expired'));

            if (body) {
                var communities = JSON.parse(body)["Communities"];

                if (req.query.field !== undefined && req.query.field === 'count') {
                    debug("req files " + req.query.field)
                    res.send({count: communities.length});
                }
            } else {
                res.send({count: 0});
            }
        });

};


/**
 * Index of the community, list of the communities
 */

exports.index = function(req, res, next){
    debug('community list '+req);
    debug(req.body);
    debug(" PARAMS ------> " + req.query.field);
    debug("req.path: " + req.path);

    debug("parsedServerURL "+JSON.stringify(parsedServerURL));
    debug("parsedServerURL.pathname "+parsedServerURL.pathname);

    var reloadToken = req.param("reloadToken");
    
    if(reloadToken == true) {
      
      
    }

  // CommunityConstr.findOne({}, function(error, community){
        var url =  UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/list";

        debug("url is: " + url);

        var options = {
            url: url,
            method: 'GET',
            headers: {
                requestCert: true,
                rejectUnauthorized: false,
                'Content-Type': 'application/JSON',
                //'Community-Token': community.token,
                'Community-Token': req.user.idm_token
            }
        };
        debug("\n\n\n\noptions: " + JSON.stringify(options));

        request(options, function (error, response, body) {

            debug("error response is: " + error);
            debug("body response is: " + body);
            debug("body response is: " + typeof body);
            debug("response response is: " + response.statusCode);

            if(body == "Not Found")
                return next(new Error('idm_token_expired'));

            if (body) {
              var communities = JSON.parse(body)["Communities"];


              debug("communities are: " + JSON.stringify(communities));
              debug("error  is: " + error);
              return res.render('communities/index', {
                title: 'Communities',
                communities: communities
              });
            } else
              return res.render('communities/index', {
                title: 'Communities',
                communities: []
              });
        });
    // });
};




/**
 * List of my communities          //// /DA COMPLETARE
 */

exports.listMyCommunities = function(req, res){

    var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/listMyComms";

    var options = {
      url: url,
      method: 'GET',
      headers: {
        requestCert: true,
        rejectUnauthorized: false,
        'Content-Type': 'application/JSON',
        'Community-Token': req.user.idm_token
      }
    };

    debug("url is: " + url);
    debug("options to send : ");
    debug(options);

    request(options, function (error, response, body) {
      if (!error && response.statusCode != "404") {
        debug("listMyCommunities body is: " + JSON.stringify(response));
        res.send({result:"success", communities: JSON.parse(body).communities});
      } else {
        res.send({result:"error", message: "Error while getting list of communities"});
      }
    });


};




function getCommunityTokenInfoWithID(idm_token, community_ID, cb){
  var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/getCommunity";
  var body = {
      "communityID": community_ID
  };

  debug("url: " + url);
  debug("body: " + JSON.stringify(body));

      var options = {
        url: url,
        body: JSON.stringify(body),
        headers: {"Content-Type": "application/json", "Community-Token": idm_token, "Accept": "application/json"}
    };

      request.post(options, function (error, response, body) {
          if(error) {
              debug("getCommunityTokenInfoWithID response.statusCode " + response.statusCode);
              debug("getCommunityTokenInfoWithID error " + error);
              return cb(error, null);
            } else {
              debug("getCommunityTokenInfoWithID response.statusCode " + response.statusCode);
              debug("getCommunityTokenInfoWithID body " + body);
              debug("getCommunityTokenInfoWithID typeof body " + typeof body);
              cb(null, JSON.parse(body));
            }
        })
  }









/**
 * New community
 */

exports.new = function(req, res){

  debug("function communities new");
  res.render('communities/new', {
    title: 'New Community'
  });
};


function listRoles(community_token, cb){
    var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/listRoles";
    var options = {
        url :url,
        method: 'GET',
        headers : {
            "Content-Type": "application/json",
            'Community-Token': community_token
        }
    };

    request(options, function (error, response, body) {
        if(error) {
            debug("listRole response.statusCode " + response.statusCode);
            debug("listRole error " + error);
            return cb(error, null);
        } else {
            debug("listRole response.statusCode " + response.statusCode);
            debug("listRole body " + body);
            debug("listRole typeof body " + typeof body);
            cb(null, JSON.parse(body));
        }
    })
}





function getCommunityToken(idm_token, community_name, domain_name, cb){

  var domain_name = DOMAIN_NAME;
  var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/TOKEN/request";


  var body = {
    "tokenUUID":idm_token,
    "communityName":community_name,
    "domainName":domain_name
  };

  var options = {
    url :url,
    body: JSON.stringify(body),
    headers : {"Content-Type":"application/json", "Accept": "application/json"}
  };

  request.post(options, function (error, response, body) {
    debug("response.status "+response.statusCode);


    if(error || response.statusCode == '404') {
      debug("getCommunityToken error "+error);
      cb("getCommunityToken error "+error, null);
    } else {

      debug("getCommunityToken body: "+ body);

      if (typeof body == 'string'){
          body = JSON.parse(body);
      }

      debug("getCommunityToken headers "+ util.inspect(response.headers));
      debug("communityToken  "+body.communityToken);
      debug("typeof body  "+typeof body);

      var commToken = body.communityToken;

      cb(null, commToken);
    }
  })

}
exports.getCommunityToken = getCommunityToken;


function createCommunity(idm_token, communityName, description, owner,  cb){

  var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/create";

  debug("url: "+url);

  var body = {description:description,
              communityName:communityName,
              contact: owner
  };

  var options = {
    url :url,
    body: JSON.stringify(body),
    headers : {"Content-Type": "application/json", "Community-Token": idm_token, "Accept": "application/json"}
  };

  debug("options is :" );
  debug(options);

  request.post(options, function (error, response, body) {
    if(error) {
      debug("errore: "+error);
    } else {
      debug("response is: "+JSON.stringify(response));
      debug("statuscode and body", response.statusCode, body);
      debug("body " + body);

      if(response.statusCode == '201'){
        cb(null, JSON.parse(body));
        debug("creation ok");
      }
      else{
        debug("error creating community ");
        cb("failed", null);
      }

    }
  })

}


function requestToken (idm_token, domainName, communityName, cb){

  var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/TOKEN/request";
  debug("url: "+url);

  var body = {tokenUUID:idm_token,
              domainName:domainName,
              communityName: communityName};
  var options = {
    url :url,
    body: JSON.stringify(body),
    headers : {"Content-Type": "application/json", "Accept": "application/json"}
  };

  debug("options ")
  debug(options);

  request.post(options, function (error, response, body) {
    if(error) {
      debug("errore: "+error);
    } else {

      debug("statuscode ");
      debug(response.statusCode, body);
      debug("body ");
      debug(body);

      if(response.statusCode == '201'){
        cb(null, JSON.parse(body));
        debug("request token is ok");
      }
      else{
        debug("error requesting token community ");
        cb("failed", null);
      }

    }
  })





}


/**
 * Create community in the context manager
 */

exports.create = function (req, res) {
  debug('\n New create Community request');
  debug('\n\n\n req.body: ' + JSON.stringify(req.body));
  debug('\n\n\n req.user: ' + JSON.stringify(req.user));

  var owner = {
    name : req.user.name,
    email : req.user.email
  };

    createCommunity(req.user.idm_token, req.body.community.name, req.body.community.description, owner, function(error, result){

    if (error){
      res.send({result:"failed"});
    }else if (result) {
      debug("result is:" + JSON.stringify(result));

      requestToken(req.user.idm_token, DOMAIN_NAME, req.body.community.name, function (error, result) {
        if (error) {
          res.send({result: "failed"});
        }else if (result){

            var community = {community_id:result.values.token.community.id,
                           name: result.values.token.community.name,
                           token: result.communityToken,
                           domain_name: result.values.token.community.domain.name};

          debug(JSON.stringify("request returns community: "+JSON.stringify(result)));

          var communityObj = new CommunityConstr(community);
          communityObj.save();

          // req.user.communities.push(community);
          // req.user.save();

          res.send({result:"success"});
        }
      });
    }
  });


};





exports.delete = function (req, res) {
  var community_id = req.param("community_id");
  var community_name = req.param("community_name");

  debug("deleting Community");
  var url = UCSERVER.protocol + UCSERVER.host + ":" + UCSERVER.port + UCSERVER.basepath_COMM_V1 + "/COMMUNITIES/deleteCommunity/" + community_id;
  debug("url: " + url);


  // getCommunityTokenInfoWithID(community_id, function(error, community_info){
  //
  //   if (!error && community_info && community_info != "undefined") {
  //
  //     var community_name = community_info.Community.name;

  getCommunityToken(req.user.idm_token, community_name, DOMAIN_NAME, function (error, communityToken) {
    if (!error && communityToken && communityToken != "undefined") {
      debug("\n\n---------------------------------------------------------------- communityToken: " + communityToken);

      var options = {
        url: url,
        headers: {
          "Content-Type": "application/json",
          "Community-Token": communityToken
        }
      };
      debug("options ");
      debug(options);

      request.del(options, function (error, response, body) {

        if (error) {
          debug("errore: " + error);
          if (response.error !== undefined && response.error == 401)
            res.send({message: "Unauthorized "});
        } else {
          debug("response is: " + JSON.stringify(response));
          res.send({success: true});
        }
      });
    } else if (error == "Unauthorized") {
      res.status(200).send({message: "You are unauthorized to delete this community", revoke: false});      //***************************************************** e' errore 401 ma per adesso rimane così
    }
  });
  
    // }else {
    //   res.status(200).send({message: "You are unauthorized to delete this community", revoke: false});      //***************************************************** e' errore 401 ma per adesso rimane così
  //   }
  // });

};
