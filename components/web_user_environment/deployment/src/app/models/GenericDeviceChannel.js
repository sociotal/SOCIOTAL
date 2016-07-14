var debug = require('debug')('models:GenericDeviceChannel');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');
var channel = require('./channel');



var GenericDeviceSchema = ChannelSchema.extend({

  context:String,
  unit:String

});


// il metodo runTriggers sara' invocato da uno scheduler
GenericDeviceSchema.methods.test = function(args){
    debug(args);

};

mongoose.model('GenericDeviceChannel', GenericDeviceSchema);
module.exports = GenericDeviceSchema;
