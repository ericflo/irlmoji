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
    return callback(error, res);
  };
}

function setupApi(opts) {
  var urlBase = opts.urlBase;
  var csrf = opts.csrf || null;

  function getCurrentUser(callback) {
    request
      .get(urlBase + '/api/v1/users/current.json')
      .set('Accept', 'application/json')
      .end(handleErrors(callback));
  }

  function createUserByTwitter(accessToken, accessSecret, callback) {
    request
      .post(urlBase + '/api/v1/users/twitter.json')
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
    request
      .get(urlBase + '/api/v1/timelines/home.json')
      .set('Accept', 'application/json')
      .end(handleErrors(callback));
  }

  function getUserTimeline(username, callback) {
    request
      .get(urlBase + '/api/v1/timelines/user/username/' + username + '.json')
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