/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var async = require('async');
var common = require('./components/common');
var auth = require('./components/auth');

// Wrappers for the handlers, whether you need auth or not

function authed(app, func) {
  if (!app.getUserId()) {
    var Auth = auth.Auth;
    return app.render(<Auth />);
  }
  return function() {
    return _.partial(func, app).apply(null, arguments);
  };
}

function unauthed(app, func) {
  return function() {
    return _.partial(func, app).apply(null, arguments);
  };
}

// The handlers themselves

function handleIndex(app) {
  app.api.getCurrentUser(function(err, res) {
    app.render(<p>You are logged in! ({res.body.user.username})</p>);
  });
}

// Generates the routes and binds function partials

function getRoutes(app) {
  return [
    ['/', authed(app, handleIndex)]
    //['/:username', requireAuth(userProfile)]
  ]
}

function getNotFound(app) {
  var NotFound = common.NotFound;
  app.render(<NotFound />, {statusCode: 404});
}

module.exports = {
  getRoutes: getRoutes,
  getNotFound: getNotFound
};