var debug = require('debug')('controllers:authentication');

/**
 *  Authentications for third party app (es 30boxes)
 */

var user_channels;

/**
 *  Contains all requests from clients.
 *  Used for long-polling requests
 */
var client_requests = [];

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var config = require('../../config/config');
var app = require('../../server');

var https = require("https");


var hostname = require('os').hostname();
//HOST = (hostname.indexOf('local') > -1) ? "localhost" : "sociotal.crs4.it";

if(hostname.indexOf('local') > -1)
    HOST = "http://localhost:3000";
if(hostname.indexOf('sociotal') > -1)
    HOST = "http://sociotal.crs4.it";

////////*******************************************************

exports.getAuthToken30boxes = function (req, res) {
  var channel_type= req.params.type;   // the channel type: xively or other

  var ChannelConstr=mongoose.model('ThirtyBoxesChannel');
  var channel = new ChannelConstr(req.body);
  //console.log(Channel)
  debug("30boxes::auth token call");
  debug(this.apiKey);
  debug(this.authorizedUserToken);
  debug(this.t_event);

  // self is the "this" object. used to avoid the scope issues.
  self = this;

  var applicationLogoUrl = HOST+ '/img/sociotal_logo.png';
  var apiKey = '8464726-962ce1a28d677663b0ff168f7d7c7103';
  var returnUrl = HOST+ '/channels/form/ThirtyBoxesChannel?apiKey='+apiKey;
  var applicationName = 'SocIoTal';

  var port = https;
  var obj;
  var url_path= 'https://30boxes.com/api/api.php?method=user.Authorize&apiKey='+apiKey+'&applicationName='+applicationName+'&applicationLogoUrl='+applicationLogoUrl+'&returnUrl='+returnUrl;

  debug(url_path);
  res.redirect(url_path);

};
