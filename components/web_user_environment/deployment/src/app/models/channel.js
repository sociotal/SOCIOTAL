
/**
 * Module dependencies.
 */



var debug = require('debug')('models:channel');
var mongoose = require('mongoose');
var Imager = require('imager');
var env = process.env.NODE_ENV || 'development';
var config = require('../../../sociotal/config/config')[env];
var imagerConfig = require(config.root + '/config/imager.js');
var Schema = mongoose.Schema;
var utils = require('../../../sociotal/lib/utils');
var async = require('async');




//Sub-doc
var ConnectionSchema = mongoose.Schema({
  name: String,
  trigger: {
        attribute:String, name:String, check: {},
        negation:{type : Boolean , default: false},

  },
  action: {
        targetChannelId: Schema.Types.ObjectId,
        targetChannelName: String,
        actionName: String,
        arg:{}

  },
  active: {type: Boolean, default: false},
  label: String
});



/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',');
};

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',');
};



//var DataSchema = mongoose.Schema({
//    date_created: Date,
//    payload: {}
//
//});

// inbox/outbox data schema
var DataSchema = mongoose.Schema({
    date_created: {type : Date, default : Date.now},
    request_type: {type : String, default: ''},     // read, action, filter, ecc
    data_type: {type : String, default: ''},        // current value, angolo, velocità ecc
    value: {type : String , default: ''},
    unit: {type : String, default: ''},
    valid: {type: Boolean, default: true}
});


/**
 * Channel Schema
 */
ChannelSchema = new Schema({
  title: {type : String, default : '', trim : true, required: true},
  channel_type:{type : String, default: '', trim:true, required: true},
  description: {type : String, default : '', trim : true},
  user: {type : Schema.ObjectId, ref : 'User', index: 1},
  tags: {type: [], get: getTags, set: setTags},
  inbox: [DataSchema],
  inboxSize: {type: Number, default : 0},
  outbox: [DataSchema],
  subscribed: {type : Boolean, default : false},
  anomalyDetection: {type : Boolean, default : false},
  image: {
    cdnUri: String,
    files: []
  },
  createdAt  : {type : Date, default : Date.now},
  interval_sec: {type: Number, default: 60},//interval for recurring scheduling
  connections: [ConnectionSchema]

}, { collection : 'channels', discriminatorKey : '_type' });





/**
 * Validations
 */

ChannelSchema.path('title').required(true, 'Channel title cannot be blank');

/**
 * Pre-remove hook
 */

ChannelSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3');
  var files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err);
  }, 'channel');

  next();
});

/**
 * Methods
 */

ChannelSchema.methods = {

      /**
       * Save channel and upload image
       *
       * @param {Object} images
       * @param {Function} cb
       * @api private
       */

      uploadAndSave: function (images, cb) {

        debug("dentro upload and save");
        if (!images || !images.length) return this.save(cb);

        var imager = new Imager(imagerConfig, 'S3');
        var self = this;

        this.validate(function (err) {
          if (err) return cb(err);
          imager.upload(images, function (err, cdnUri, files) {
            if (err) return cb(err);
            if (files.length) {
              self.image = { cdnUri : cdnUri, files : files };
            }
            self.save(cb);
          }, 'channel');
        });
      },


      addConnection: function (connection){

        if(connection){
          this.connections.push(connection);
        }

      },

      removeConnection: function (connectionId){
        if(connectionId){
          var conn = this.connections.filter(function(item){
            return (item._id == connectionId);
          });
          var index = this.connections.indexOf(conn[0]);
          this.connections.splice(index, 1);
        }
      },


    runTriggers: function(val, pubsubBroker){

        debug("\nRun triggers..." );

        this.connections.forEach(function(conn){
            if(val.name == conn.trigger.attribute){
                debug("Running Connection with val %s and triggers %s:",  JSON.stringify(val), JSON.stringify(conn.trigger));
                debug("\t conn is: " + JSON.stringify(conn));
                var triggerName = conn.trigger.name;
                var triggerCheck = conn.trigger.check;
                var triggerNegation = conn.trigger.negation;

                var Trigger = mongoose.model('TriggerSchema');
                //check function
                var triggerResult = new Trigger().getTriggerFunction(triggerName)[0].callback(val.value, triggerCheck, triggerNegation);

                debug("Trigger:");
                debug("\t name: " + triggerName);
                debug("\t nega: " + triggerNegation);
                debug("\t value: " + val.value);
                debug("\t check: " + triggerCheck);
                debug("\t label: " + conn.label);
                debug("\t result: " + triggerResult);

                if(triggerResult){

                    var event = {
                        channelId: conn.action.targetChannelId,
                        actionName: conn.action.actionName,
                        arg:conn.action.arg
                    };

                    var Channel = mongoose.model('Channel');
                    Channel.findOne({'_id': conn.action.targetChannelId}, function(err, channel){

                      if (channel) {

                        switch (channel.channel_type) {
                          case "PhoneChannel":
                            event.arg = {registration_id: channel.registration_id, message: conn.action.arg};
                            break;
                        }
                        

                        pubsubBroker.publish(config.connectionPubSubTopic, event,
                          function (err) {
                            if (!err) debug('message published: ' + JSON.stringify(event) + "\n");
                            else debug(err);
                          }
                        );
                      }
                    });
                }
            }
        });

    }
};

/**
 * Statics
 */

ChannelSchema.statics = {

  /**
   * Find channel by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (criteria, cb) {
    this.findOne(criteria, {"inbox":0})
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb);
  },

  /**
   * List channels
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};

    this.find(criteria)
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

  triggerDictionary: [],

  actionDictionary: []


};

mongoose.model('Channel', ChannelSchema);
//exports.ChannelSchema = ChannelSchema;
module.exports = ChannelSchema;
