/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');

/**
 * List items tagged with a tag
 */

exports.index = function (req, res) {
  var criteria = { tags: req.param('tag') };
  var perPage = 5;
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var options = {
    perPage: perPage,
    page: page,
    criteria: criteria
  };

  Channel.list(options, function(err, channels) {
    if (err) return res.render('500');
    Channel.count(criteria).exec(function (err, count) {

      req.channels = channels;
      user_channels = channels;

      res.render('channels/index', {
        title: 'Channels tagged ' + req.param('tag'),
        channels: channels,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      });
    });
  });
};
