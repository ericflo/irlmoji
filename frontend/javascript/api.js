var request = require('superagent');
var _ = require('lodash/dist/lodash.underscore');

function handleErrors(callback) {
  return function(error, res) {
    if (error) {
      return callback(error, res);
    }
    if (res.body.error) {
      return callback(res.body.error, res);
    }
    // Ensure that no non-success results masquarade as successes
    if (res.status !== 200) {
      return callback('Sorry, we encountered an unknown error (code ' +
        res.status + '), please try again.', res);
    }
    return callback(error, res);
  };
}

function setupApi(opts) {
  var urlBase = opts.urlBase;
  var csrf = opts.csrf || null;
  var authUsername = opts.authUsername;
  var authPassword = opts.authPassword;

  function authed(req) {
    if (authUsername && authPassword) {
      req = req.auth(authUsername, authPassword);
    }
    return req;
  }

  function getCurrentUser(callback) {
    authed(request.get(urlBase + '/api/v1/users/current.json'))
      .set('Accept', 'application/json')
      .end(handleErrors(callback));
  }

  function createUserByTwitter(accessToken, accessSecret, callback) {
    authed(request.post(urlBase + '/api/v1/users/twitter.json'))
      .type('json')
      .send({
        twitterAccessToken: accessToken,
        twitterAccessSecret: accessSecret
      })
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', csrf)
      .end(handleErrors(callback));
  }

  function getHomeTimeline(callback) {
    authed(request.get(urlBase + '/api/v1/timelines/home.json'))
      .set('Accept', 'application/json')
      .end(handleErrors(callback));
  }

  function getUserTimeline(username, callback) {
    var url = urlBase + '/api/v1/timelines/user/username/' + username + '.json';
    authed(request.get(url))
      .set('Accept', 'application/json')
      .end(handleErrors(callback));
  }

  return {
    getCurrentUser: getCurrentUser,
    createUserByTwitter: createUserByTwitter,
    getHomeTimeline: getHomeTimeline,
    getUserTimeline: getUserTimeline
  };
}

module.exports = {
  setupApi: setupApi
};