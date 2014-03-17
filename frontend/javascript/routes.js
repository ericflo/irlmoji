/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var async = require('async');
var common = require('./components/common');
var auth = require('./components/auth');

// Basic handlers for things like not found pages, server errors, and auth

function handleNotFound(app) {
  var NotFound = common.NotFound;
  app.render(<NotFound />, {statusCode: 404});
}

function handleServerError(app) {
  var ServerError = common.ServerError;
  app.render(<ServerError />, {statusCode: 500});
}

function handleAuth(app) {
  var Auth = auth.Auth;
  app.render(<Auth app={app} onLogin={function(user) {
    app.router.reload();
  }} />);
}

// The handlers themselves

function handleIndex(app, user) {
  app.render(<p>You are logged in! ({user.username}) <a href="/" onClick={function(ev) {
    app.router.go('/');
    return false;
  }}>Home</a> <a href="/logout">Logout</a></p>);
}

// Generates the routes and binds function partials

function getRoutes(app) {
  return [
    ['/', prepareHandler(app, handleIndex, true)]
    //['/:username', prepareHandler(userProfile)]
  ]
}

function getNotFound(app) {
  return _.partial(handleNotFound, app);
}

// Wrappers for the handlers to prepare them with app instances and user auth

function prepareHandler(app, func, authRequired) {
  if (!authRequired) {
    return function() {
      if (!app.isServer()) {
        app.loadingBegan();
      }
      return _.partial(func, app).apply(null, arguments);
    }
  }
  return _.partial(app.api.getCurrentUser, function(err, res) {
    if (!app.isServer()) {
      app.loadingBegan();
    }
    if (err) {
      return handleServerError(app);
    }
    if (!res.body.user) {
      return handleAuth(app);
    }
    return _.partial(func, app, res.body.user).apply(null, arguments);
  });
}

module.exports = {
  getRoutes: getRoutes,
  getNotFound: getNotFound
};