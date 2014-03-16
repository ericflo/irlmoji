/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var async = require('async');
var common = require('./components/common');
var auth = require('./components/auth');

// Wrappers for the handlers, whether you need auth or not

function authed(app, func) {
  return _.partial(app.api.getCurrentUser, function(err, res) {
    if (!res.body.user) {
      return handleAuth(app);
    }
    return _.partial(func, app, res.body.user).apply(null, arguments);
  });
}

function unauthed(app, func) {
  return function() {
    return _.partial(func, app).apply(null, arguments);
  };
}

// The handlers themselves

function handleAuth(app) {
  function handleLogin(user) {
    app.router.reload();
  }
  var Auth = auth.Auth;
  app.render(<Auth app={app} onLogin={handleLogin} />);
}

function handleIndex(app, user) {
  app.render(<p>You are logged in! ({user.username}) <a href="/logout">Logout</a></p>);
}

// Generates the routes and binds function partials

function getRoutes(app) {
  return [
    ['/', authed(app, handleIndex)]
    //['/:username', requireAuth(userProfile)]
  ]
}

function getNotFound(app) {
  return function() {
    var NotFound = common.NotFound;
    app.render(<NotFound />, {statusCode: 404});
  };
}

module.exports = {
  getRoutes: getRoutes,
  getNotFound: getNotFound
};