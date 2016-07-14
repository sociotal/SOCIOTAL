/*!
 * Module dependencies.
 */

var async = require('async');

/**
 * Controllers
 */

var users = require('../app/controllers/users')
    , channels = require('../app/controllers/channels')
    , communities = require('../app/controllers/communities')
    , authentications = require('../app/controllers/authentications')
    , auth = require('./middlewares/authorization')

//if(process.env.CM === 'v3Https'){
    var context  = require('../app/controllers/contextV3');
//} else {
//    var context  = require('../app/controllers/context')
//
//}




/**
 * Route middlewares
 */

var channelAuth = [auth.requiresLogin, auth.channel.hasAuthorization];
var commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization];
var deleteUserAuth = [auth.requiresLogin, auth.user.hasAuthorization];

/**
 * Expose routes
 */

module.exports = function (app, passport) {

    app.disable('etag');

    // user routes
    app.get('/login',  users.login);
    app.get('/signup', users.signup);
    app.get('/logout', users.logout);
    app.post('/users', users.create);
    //app.get('/users', users.list);
    app.get('/usersonline', users.usersonline);

    app.post('/users/session',
        passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        }));


    app.get('/users/:userId', auth.requiresLogin, users.show);
    app.delete('/users/:userId', deleteUserAuth, users.delete);
    app.get('/users/activation/:token', users.activation);
    app.get('/users/password/forgot', users.forgot);
    app.post('/users/password/email', users.sendEmail);
    app.post('/users/password/reset', users.resetPassword);

    // Facebook routes ------------------------------
    app.get('/auth/facebook',
        function(req,res,next) {
            passport.authenticate(
                'facebook',
                {
                    scope: [ 'email', 'user_about_me'],
                    failureRedirect: '/login',
                    callbackURL: "/auth/facebook/callback"
                }
            )(req,res,next);
        },
        users.signin);


    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            failureRedirect: '/login',
            callbackURL: "/auth/facebook/callback"
        }), users.authCallback);


    /*
     function(req, res) {
     console.log(req.user);
     res.redirect("/profile?access_token=" + req.user.access_token);
     }
     */
    // Facebook routes -------------------------- END

    app.get('/profile',
        passport.authenticate('bearer', { session: false }),
        function(req, res) {
            res.send("LOGGED IN as " + req.user.facebook.name + " - <a href=\"/logout\">Log out</a>");
        }
    );

    app.param('userId', users.user);
    app.param('id', channels.load);

    app.get('/authentications/getAuthToken30boxes', authentications.getAuthToken30boxes);


    // CONTEXT
    app.get('/devices/discovery', auth.requiresLogin, context.discovery_GET);
    app.post('/devices/discovery', auth.requiresLogin, context.discovery_POST);
    app.get('/devices/new', auth.requiresLogin, context.new);
    app.get('/devices/new/:type', auth.requiresLogin, context.form);
    app.get('/devices', auth.requiresLogin, context.listView);
    app.get('/api/devices', auth.requiresLogin, context.list);
    app.get('/devices/:context_id', auth.requiresLogin, context.show);
    app.get('/devices/:context_id/edit', auth.requiresLogin, context.edit);

    app.put('/devices', auth.requiresLogin, context.update); // to update attribute value Simulate device behavior
    app.del('/devices/:context_id', auth.requiresLogin, context.delete);
    app.post('/devices/register', auth.requiresLogin, context.register);


    // COMMUNITIES
    app.get('/communities', auth.requiresLogin, communities.index);
    app.get('/communities/new', auth.requiresLogin, communities.new);
    app.post('/communities/create', auth.requiresLogin, communities.create);
    app.get('/communities/listMyCommunities', auth.requiresLogin, communities.listMyCommunities);
    app.get('/communities/getUserInfoByID/:user_id', auth.requiresLogin, communities.getUserInfoByID);

    app.get('/communities/show', auth.requiresLogin, communities.show);
    app.del('/communities/:community_id/:community_name', auth.requiresLogin, communities.delete);

    app.get('/communities/:community_id/affiliation', auth.requiresLogin, communities.requestAffiliation);
    app.get('/communities/:community_id/revoke', auth.requiresLogin, communities.revokeAffiliation);
    app.get('/communities/:community_name/members',  auth.requiresLogin, communities.listUsers);
    app.get('/api/communities', auth.requiresLogin, communities.count);

    app.get('/communities/:community_id/add/:member_id', auth.requiresLogin,  communities.add);


    // CHANNELS
    app.get('/channels', auth.requiresLogin, channels.index);
    app.get('/channels/new/:type', auth.requiresLogin, channels.form);
    app.get('/listchannels', auth.requiresLogin, channels.listChannels);
    app.post('/channels', auth.requiresLogin, channels.createChannel);              //    instead of create
    app.get('/channels/new', auth.requiresLogin, channels.new);
    app.get('/channels/:id', channelAuth, channels.show);
    app.get('/channels/:id/edit', channelAuth, channels.edit);
    app.get('/channels/:id/run', channelAuth, channels.run);
    app.put('/channels/:id', channelAuth, channels.update);
    app.del('/channels/:id', channelAuth, channels.destroy);


    // CHANNELS - DATA
    app.get('/channels/:id/data', channelAuth, channels.listData);
    app.get('/channels/:id/data/clear', channelAuth, channels.clearData);

    //app.get('/channels/:id/data/detectanomaly', channelAuth, channels.detectAnomaly);

    // CHANNELS - CONNECTIONS/COMPOSITION
    app.post('/channels/:id/connections', channelAuth, channels.saveConnection);
    app.del('/channels/:id/connections/:connId', channelAuth, channels.deleteConnection);
    app.get('/channels/:id/connections', channelAuth, channels.listConnections);

    // CHANNELS - ATTRIBUTES
    app.post('/channels/:id/attributes', channelAuth, channels.saveAttribute);
    app.del('/channels/:id/attributes/:attributeId', channelAuth, channels.deleteAttribute);
    app.get('/channels/:id/attributes', channelAuth, channels.listAttributes);

    // CHANNELS - SUBSCRIPTIONS
    app.post('/channels/:id/subscribe', channelAuth, channels.subscribeChannel);
    app.post('/channels/:id/unsubscribe', channelAuth, channels.unsubscribeChannel);
    app.get('/channels/:id/subscriptions', channelAuth, channels.listSubscriptions);

    // CHANNELS - TRIGGERS
    app.get('/channels/:id/triggers/:data_type', channelAuth, channels.listTriggers);

    // CHANNELS - PUSH NOTIFICATIONS
    app.post('/channels/:id/notify', auth.requiresLogin, channels.sendNotification);

    // CHANNELS -  ANOMALY DETECTION
    app.get('/channels/:id/activateAnomalyDetection', auth.requiresLogin, channels.activateAnomalyDetection);
    app.get('/channels/:id/deactivateAnomalyDetection', auth.requiresLogin, channels.deactivateAnomalyDetection);

    // ******************************* API *******************************
    app.get('/api/channels',      passport.authenticate('bearer', { session: false }), channels.getMobChannels);
    app.get('/api/channels/:id',  passport.authenticate('bearer', { session: false }), channels.get);
    app.put('/api/channels/:id',  passport.authenticate('bearer', { session: false }), channels.updateChannel);
    app.del('/api/channels/:id',  passport.authenticate('bearer', { session: false }), channels.destroy);
    app.post('/api/channels',     passport.authenticate('bearer', { session: false }), channels.createChannel);

    // get values from channel stored in the WUE database
    app.get('/api/channels/:id/data',  passport.authenticate('bearer', { session: false }), channels.getData);


    // receive data from ContextManager Pub/Sub
    app.post('/api/channels/:id/receive', channels.receiveData);
    app.post('/api/debug/logwrite', channels.logWrite);

    // register a smartphone of the user
    app.post('/api/users/devices/register', passport.authenticate('bearer', { session: false }), channels.createChannel); // while registering a device a new channel PhoneChannel will be created
    //app.post('/api/users/devices/notify', passport.authenticate('bearer', { session: false }), channels.sendNotification);

    // test only
    // app.post('/api/channels/discovery', passport.authenticate('bearer', { session: false }), channels.discoveryContext)
    // app.post('/api/channels/register',  passport.authenticate('bearer', { session: false }), context.register)


    // CONNECTIONS/COMPOSITION
    app.post('/api/channels/:id/compositions',          passport.authenticate('bearer', { session: false }), channels.createComposition);
    app.get( '/api/channels/:id/compositions',          passport.authenticate('bearer', { session: false }), channels.getComposition);
    app.get( '/api/channels/:id/compositions/:compid',  passport.authenticate('bearer', { session: false }), channels.getComposition);
    app.put( '/api/channels/:id/compositions/:compid',  passport.authenticate('bearer', { session: false }), channels.updateComposition);
    app.del( '/api/channels/:id/compositions/:compid',  passport.authenticate('bearer', { session: false }), channels.deleteComposition);

    //API per Ignacio
    app.post('/api/capability/generate', passport.authenticate('bearer', { session: false }), context.genCapabilityToken );




    // home route
    app.get('/', auth.requiresLogin, users.home);
    // comment routes
    var comments = require('../app/controllers/comments');
    app.param('commentId', comments.load);
    app.post('/channels/:id/comments', auth.requiresLogin, comments.create);
    app.get('/channels/:id/comments', auth.requiresLogin, comments.create);
    app.del('/channels/:id/comments/:commentId', commentAuth, comments.destroy);

    // tag routes
    var tags = require('../app/controllers/tags');
    app.get('/tags/:tag', tags.index);

    app.get('*', function(req, res, next) {
        // put user into res.locals for easy access from templates
        res.locals.user = req.user || null;

        next();
    });


    var io = app.socketio;
    /* Socket.IO events */
    io.on("connection", function(socket){
        console.log("New client connected!");
        socket.on("disconnect", function() {
            console.log("CLIENT DISCONNECTED");
        });

    });
}
