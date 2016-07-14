
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');

/**
 * Load comment
 */

exports.load = function (req, res, next, id) {
  var channel = req.channel;
  utils.findByParam(channel.comments, { id: id }, function (err, comment) {
    if (err) return next(err);
    req.comment = comment;
    next();
  });
};

/**
 * Create comment
 */

exports.create = function (req, res) {
  var channel = req.channel;
  var user = req.user;

  if (!req.body.body) return res.redirect('/channels/'+ channel.id);

  channel.addComment(user, req.body, function (err) {
    if (err) return res.render('500');
    res.redirect('/channels/'+ channel.id);
  });
};

/**
 * Delete comment
 */

exports.destroy = function (req, res) {
  var channel = req.channel;
  channel.removeComment(req.param('commentId'), function (err) {
    if (err) {
      req.flash('error', 'Oops! The comment was not found');
    } else {
      req.flash('info', 'Removed comment');
    }
    res.redirect('/channels/' + channel.id);
  });
};
