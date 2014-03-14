var request = require('superagent');
var _ = require('lodash/dist/lodash.underscore');

function setupApi(opts) {
  var urlBase = opts.urlBase;
  var csrf = opts.csrf || null;
  var authUsername = opts.authUsername;
  var req = opts.req;

  // If we passed in the request (server), we can reconstruct the password
  if (req) {
    if (req.session['uid']) {
      opts.authPassword = req.session['uid'] + '_' + req.session['gid'];
    }
  }

  function authed(r) {
    if (opts.authUsername && opts.authPassword) {
      r = r.auth(opts.authUsername, opts.authPassword);
    }
    return r;
  }

  function getHomeTimeline(callback) {
    authed(request
      .get(urlBase + '/api/v1/timelines/home.json')
      .set('Accept', 'application/json')
    ).end(callback);
  }

  function getUserTimeline(username, callback) {
    authed(request
      .get(urlBase + '/api/v1/timelines/user/username/' + username + '.json')
      .set('Accept', 'application/json')
    ).end(callback);
  }

  var api = {
    getHomeTimeline: getHomeTimeline,
    getUserTimeline: getUserTimeline
  };

  return api;
}

module.exports = {
  setupApi: setupApi
};