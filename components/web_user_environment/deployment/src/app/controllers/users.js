
/**
 * Module dependencies.
 */
var debug = require('debug')('controllers:users');
var crypto = require('crypto');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var utils = require('../../lib/utils');
var Channel = mongoose.model('Channel');

var https = require("https");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var async = require('async');
var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

//var SECRET = "6LcTcAoTAAAAAOBz6nqvmSfpwaX6dzpflVLQqrPd";
var SECRET = config.recaptcha_secret_key;

var pem = require('pem');
var fs = require('fs');
var identity = require("./security-manager/identity/identity.js");


var login = function (req, res) {
	// var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
	// delete req.session.returnTo;

	// every time redirect to root

	// set the user online
	req.user.online = true;
	req.user.save();
	res.redirect("/");
};

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
	https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
		var data = "";
		res.on('data', function (chunk) {
			data += chunk.toString();
		});
		res.on('end', function() {
			try {
				var parsedData = JSON.parse(data);
				callback(parsedData.success);
			} catch (e) {
				callback(false);
			}
		});
	});
}


function setFacebookCallback(hostname){
	var HOST = "";
	if(hostname.indexOf('local') > -1)
		HOST = "localhost:3000";
	if(hostname.indexOf('sociotal.crs4.it') > -1)
		HOST = "sociotal.crs4.it";
	if(hostname.indexOf('sociotal.crs4.it:') > -1)
		HOST = "sociotal.crs4.it:3000";


	debug(config.facebook.callbackURL);
	config.facebook.callbackURL = "http://" + HOST + "/auth/facebook/callback";
	debug(config.facebook.callbackURL);
}


exports.signin = function (req, res) {};




/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {

	//setFacebookCallback(req.headers.host);

	res.render('users/login', {
		title: 'Login',
		message: req.flash('error')
	});
};

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
	var vm = false;
	if(process.env.NODE_ENV === 'virtualMachine')
		vm = true;

	res.render('users/signup', {
		title: 'Sign up',
		virtualmachine : vm,
		recaptcha_key: config.recaptcha_site_key,
		user: new User()


	});

};

/**
 * Logout
 */

exports.logout = function (req, res) {
	// set the user offline
	req.user.online = false;
	req.user.save();

	req.logout();

	res.redirect('/login');
};

/**
 * Session
 */

exports.session = login;

function randomValueBase64(len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')   // convert to base64 format
		.slice(0, len)        // return required number of characters
		.replace(/\+/g, '0')  // replace '+' with '0'
		.replace(/\//g, '0'); // replace '/' with '0'
}



/**
 * Create user
 */

exports.create = function (req, res) {


	verifyRecaptcha(req.body["g-recaptcha-response"], function (success) {

		if (success || process.env.NODE_ENV === 'virtualMachine') {

			var user = new User(req.body);

			user.provider = 'local';
			user.image = "/images/test_profile.jpeg";
			user.authToken = randomValueBase64(config.bearerTokenLen);
			user.activationToken = randomValueBase64(32);

			var password = req.body.password;

			debug("Captcha - Success!");
			debug("User:");
			debug(user);

			//************************************************************* fare check anche di username su WEDB

			User.findOne({ username: user.username }, function (err, result) {

				debug("CHECKING EMAIL....err: "+err+" and res: "+result);
				if (result) {
					debug("EMAIL ALREADY EXISTS IN WEDB");
					res.render('users/signup', {
						title: 'Signup',
						error: "Email " + result.email + " already registered"
					});
				} else {
					debug("EMAIL DOES NOT EXISTS IN WEDB... checking keyrock ");

					identity.getEntityByUserName(user.username, function (error, result) {
						if (result) {
							debug("USERNAME ALREADY EXISTS IN KEYROCK");
							res.render('users/signup', {
								title: 'Signup',
								error: "User " + user.username + " already registered"
							});

						} else {
							identity.addEntity(user, password, function (currentEntity) {
								debug("***************** Adding user in Keyrock calling addentity");
								var idm_id = currentEntity.getIdSync().getValueSync().toString();			//getting the id from idm
								user.idm_id = idm_id;														//storing id from idm in user env db

								debug("entity is: \n" + currentEntity.toString());
								debug("idm_id is: " + idm_id);

								user.save(function (err) {
									if (err) {
										return res.render('users/signup', {
											error: utils.errors(err.errors),
											user: user,
											title: 'Sign up'

										});
									}
									// send activation account email
									// var transporter = nodemailer.createTransport(); // direct transport
									var transporter = nodemailer.createTransport(smtpTransport(config.smtpTransportOptions));

									var protocol = (process.env.NODE_ENV === 'virtualMachine')? "http" : req.protocol;

									var mailOptions = {
										to: req.body.email,
										from: 'SocIoTal team <sociotal-team@crs4.it>',
										subject: 'SocIoTal Account Activation',
										text: 'Hi ' + req.body.name + ',\n\n' +
										'you are receiving this email because you have requested an account registration to https://sociotal.crs4.it.\n\n' +
										'Please click on the following link, or paste it into your browser to complete the process:\n\n' +
										protocol +'://' + req.headers.host + '/users/activation/' + user.activationToken +
										'\n\nIf you did not request this, please ignore this email.\n\n' +
										'Best regards!'
									};

									transporter.sendMail(mailOptions, function (err) {
										res.render('users/signup', {
											title: 'Activation mail',
											act_mail: true,
											email: req.body.email
										});
									});
								});
							});
						}
					});
				}
			});


		} else {
			res.render('users/signup', {
				title: 'Signup',
				error: "Captcha is not valid"
			});
		}
	});
};

// for PASSWORD RESET and USER REGISTRATION
exports.activation = function (req, res) {
	var token = req.param('token');
	var email = req.param('email');
	if(token)
		User.find({ 'activationToken': token, active:false }, function (err, users) {
			if (err) { return res.send({"err": err}); }
			if(users.length > 0){
				if(email !== undefined)  // in case of password reset
					res.render('users/forgot', {
						email: email,
						username: users[0].username,
						act_match:true,
						message: ""
					});

				else{ // in case of new registration
					var user = users[0];
					user.active = true;
					user.save();

					// manually login the user once successfully signed up
					/*
					 req.logIn(user, function (err) {
					 if (err) return next(err);
					 return res.redirect('/');
					 });
					 */

					return res.redirect('/');

				}

			} else {
				res.send({message: "user already active or not exists"});
			}

		});
	else{
		res.redirect('/login');
	}
};

exports.forgot = function (req, res) {
	res.render('users/forgot');
};

exports.sendEmail = function (req, res) {
	var email = req.body.email;
	if (email){
		User.find({'email': email}, function (err, users) {
			if (err) {
				return res.send({"err": err});
			}
			if (users.length > 0) {
				var user = users[0];
				user.activationToken = randomValueBase64(32);
				user.active = false;
				user.save();

				var transporter = nodemailer.createTransport(smtpTransport(config.smtpTransportOptions));
				var username = user.username;

				// send activation account email
				// var transporter = nodemailer.createTransport(); // direct transport

				var mailOptions = {
					to: req.body.email,
					from: 'SocIoTal team <sociotal-team@crs4.it>',
					subject: 'SocIoTal Password Reset',
					text: 'Hi ' + user.name + ',\n\n' +
					'you are receiving this message because you have requested to reset your account password for https://sociotal.crs4.it.\n\n' +
					'Please click the following link, or copy and paste it into your browser to complete the process:\n\n' +
					'https://' + req.headers.host + '/users/activation/' + user.activationToken + '?email=' + req.body.email +
					'\n\nIf you did not request to reset the password, please ignore this email.\n\n' +
					'Best Regards!'
				};

				transporter.sendMail(mailOptions, function (err) {
					if (err) return res.send({"err": err});
					// manually login the user once successfully signed up
					req.logIn(user, function (err) {
						if (err) return next(err);
						return;
					});

					debug("inside transporter username is: "+username);

					res.render('users/forgot', {
						title: 'Activation mail',
						act_mail: true,
						email: req.body.email
					});
				});




			} else {
				res.render('users/forgot', {message: 'User not found'});
			}

		});
	} else
		res.send({message: "user not found"});



};


exports.resetPassword = function (req, res) {
	debug("sono in resetPassword");
	var new_pass = req.body.new_pass;
	var email = req.body.email;
	var username = req.body.username;
	debug("username is: " + username);
	debug("new pwd is: " + new_pass);


	identity.setEntityPassword(req.body.username, req.body.new_pass, function (error, item) {
		if (item) {
			User.find({'username': username}, function (err, users) {
				if (err) {
					return res.send({"err": err});
				}
				if (users.length > 0) {
					var user = users[0];
					user.active = true;
					user.save();

					res.render('users/forgot', {
						title: 'Activation mail',
						act_reseted: true
					});

				} else {
					res.render('users/forgot', {act_match: true, message: 'User not found'});
				}

			});
		} else {
			res.render('users/forgot', {act_match: true, message: 'User not found'});
		}

	});
};


  //





/**
 * online users
 */

exports.usersonline = function (req, res) {
	User.find({ 'online': true }, function (err, users) {
		if (err) { return res.send({"err": err}); }
		var result = [];
		users.forEach(function(user){
			result.push(user.name);
		});

		res.send({users: result});

	});
};



exports.getUser = function(userId, cb){
	debug(req.body);

	User.find({_id: userId}, function(err, user) {
		if (err) return res.send(err, 500);
		cb(user);
	});
};


/**
 *  Show profile
 */

exports.show = function (req, res) {
	var user = req.profile;
	var user_id = req.user._id;

	res.render('users/profile', {
		title: "User profile",
		user: user
	});

};

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
	User
		.findOne({ _id : id })
		.exec(function (err, user) {
			if (err) return next(err);
			if (!user) return next(new Error('Failed to load User ' + id));
			req.profile = user;
			next();
		});
};


exports.home = function(req, res){
	debug(req.body);
	var current_user = req.user._id;

	//fill all DATA
	var stats={smartphones:0, channels:0, communities:0};

	Channel.find({user: current_user}, function(err, channels) {
		if (err) {
			return res.send(err,500);

		} else {




			var phones = channels.filter(function(channel){	return channel.channel_type == "PhoneChannel"});
			stats.smartphones = phones.length;
			stats.channels = channels.length - phones.length;
			res.render('users/home',
				{
					title:"Home",
					stats:stats
				}
			);

		}
	});
};



exports.delete = function(req, res){
	debug('Removing User: ', req.user);
	User.remove({_id: req.user._id}, function (err) {
		if (err) return res.send(err, 500);
		else{
			//removed, then remove user's channels
			Channel.remove({user: req.user._id}, function (err) {
				if (err) return res.send(err, 500);
				else{
					// set the user offline

					req.user.online = false;
					req.user.save();
					req.logout();
					res.status(200).send();
				}
			});

			// removing user from keyrock
			identity.removeEntityById(req.user.idm_id,  function(response){
				debug("calling removeEntity");
				debug(response);
			});


		}
	});

};
