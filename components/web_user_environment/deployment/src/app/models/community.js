var debug = require('debug')('models:Community');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose');

var CommunitySchema = mongoose.Schema({
    community_id: {type : String},
    name: {type : String},
    token: {type : String},
    domain_name: {type : String}
});

mongoose.model('Community', CommunitySchema);
//module.exports = comm;
