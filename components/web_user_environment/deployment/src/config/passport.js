var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  , User = mongoose.model('User')
  , Channel = mongoose.model('Channel')
var crypto = require('crypto');
var identity = require("../app/controllers/security-manager/identity/identity.js");
var debug = require('debug')('passport');
var uuid = require("uuid");


function randomValueBase64(len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64')   // convert to base64 format
    .slice(0, len)        // return required number of characters
    .replace(/\+/g, '0')  // replace '+' with '0'
    .replace(/\//g, '0'); // replace '/' with '0'
}


module.exports = function (passport, config) {
  // require('./initializer')

  // serialize sessions
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  })

  passport.deserializeUser(function (id, done) {
    User.findOne({_id: id}, function (err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function (req, username, password, done) { // callback with email and password from our form

      identity.authenticateByName(username, password, function (error_message, idm_token) {

        if (error_message && idm_token === null) {
          return done(null, false, {message: error_message});
        } else {
          debug("Authenticate on login ");

          // find a user whose username is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.findOne({username: username}, function (err, user) {
            if (err) {
              debug("Error finding in WEDB ");
              return done(err)
            }
            if (!user) {
              identity.getEntityByUserName(username, function (err, entity) {
                debug("username presente su keyrock ma non presente su wedb: " + entity);
                var newUser = new User(req.body);

                debug("username is: "+ entity.getUserNameSync().getValueSync());
                debug("id is: "+ entity.getIdSync().getValueSync());
                debug("email is: "+ entity.getAttributeSync("emails").getValueSync().getSync(0));

                var name_object = entity.getAttributeSync("name").getValueSync()

                debug("\n COMPLETE NAME is: "+ name_object.getFormattedSync());

                newUser.name = name_object.getFormattedSync();
                newUser.username = username;    // not available in the last apis. replaced by profile.id
                newUser.authToken = randomValueBase64(config.bearerTokenLen);
                newUser.activationToken = randomValueBase64(32);
                newUser.image = "/images/test_profile.jpeg";
                newUser.provider = 'keyrock';
                newUser.active = true;
                newUser.idm_token = idm_token;
                newUser.idm_id = entity.getIdSync().getValueSync()
                newUser.email = entity.getAttributeSync("emails").getValueSync().getSync(0)




                newUser.save(function (err) {
                  if (err)
                    debug(err);

                  Channel.find({user: newUser._id}, function(err, channels) {
                    if(channels) {
                      channels.forEach(function (channel) {

                        if (channel._type === "CommunityMailChannel") {

                          debug("channelmail idmtoken is: "+channel.user_idm_token);

                          channel.user_idm_token = user.idm_token;
                          channel.save();

                          debug("channelmail idmtoken is: "+channel.user_idm_token);

                        }
                      });
                    }
                  });

                  return done(null, newUser)
                });

              });

            } else if (!user.active) {
              return done(null, false, {message: 'User not active'})
            } else if (user) {
              debug ("user presente ma aggiorno idm auth token al login....\n")
              user.idm_token = idm_token;



              Channel.find({user: user._id}, function(err, channels) {
                if(channels) {
                  channels.forEach(function (channel) {

                    if (channel._type === "CommunityMailChannel") {

                      debug("channelmail idmtoken is: "+channel.user_idm_token);

                      channel.user_idm_token = user.idm_token;
                      channel.save();

                      debug("channelmail idmtoken is: "+channel.user_idm_token);

                    }
                  });
                }
              });

              user.save(function (err) {
                if (err)
                  debug(err);
                return done(null, user);
              });
            }

          })
        }
      })
    }
  ));


  passport.use(
    new BearerStrategy(
      { passReqToCallback: true },
      function(req, accessToken, done) {
        User.findOne({authToken: accessToken},
          function (err, user) {
            if (err) {
              return done(err)
            }
            if (!user) {
              return done(null, false)
            }
            if(req.channel !== undefined)
              if (user._id.toString() !== req.channel.user._id.toString()){
                return done(null, false)
              }
            return done(null, user, {scope: 'all'})
          }
        );
      }
    )
  );




  // use facebook strategy
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({'email': profile._json.email}, function (err, user) {
        if (err) {
          return done(err)
        }
        if (!user) {
          user = new User();
          user.hashed_password = uuid.v4();
          user.email = profile._json.email;
          user.username = profile.id;

        }

        user.name = profile.displayName;
        //user.username = profile.username;    // not available in the last apis. replaced by profile.id
        user.authToken = randomValueBase64(config.bearerTokenLen);
        user.activationToken = randomValueBase64(32);
        user.image = "http://graph.facebook.com/" + profile.id + "/picture";
        user.provider = 'facebook';
        user.active = true;
        user.facebook = profile._json;


        debug("profile username is " + profile.username);
        debug("CHECK IF USER IS REGISTERED IN KEYROCK checking idm_id in our database ");
        if (!user.idm_id) {
          debug("NO IDM_ID: USER IS NOTE REGISTERED IN KEYROCK");
          identity.addEntity(user, function (currentEntity) {
            debug("calling createEntity from passport");
            var idm_id = currentEntity.getIdSync().getValueSync().toString();			//getting the id from idm
            user.idm_id = idm_id;																										//storing id from idm in user env db


            debug("entity is: \n" + currentEntity.toString());
            debug("idm_id is: " + idm_id);
            authenticateOnIdm(user, function (newUser) {
              newUser.save(function (err) {
                if (err)
                  debug(err);
                return done(null, newUser)
              });
            });
          });

        } else {          // IDM IS PRESENT SO USER IS IN KEYROCK
          authenticateOnIdm(user, function (newUser) {
            newUser.save(function (err) {
              if (err)
                debug(err);
              return done(null, newUser)
            });
          });
        }

        //user.save(function (err) {
        //  if (err) console.log(err)
        //  return done(err, user)
        //})

      });
    }
  ))

}
