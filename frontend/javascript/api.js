var request = require('superagent');
var _ = require('lodash/dist/lodash.underscore');

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
      .end(parseResponse(callback));
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
      .end(parseResponse(callback));
  }

  function getHomeTimeline(limit, callback) {
    authed(request.get(urlBase + '/api/v1/timelines/home.json'))
      .query({limit: limit})
      .set('Accept', 'application/json')
      .end(parseResponse(callback));
  }

  function getUserTimeline(username, limit, callback) {
    var url = urlBase + '/api/v1/timelines/user/username/' + username + '.json';
    authed(request.get(url))
      .query({limit: limit})
      .set('Accept', 'application/json')
      .end(parseResponse(callback));
  }

  function getEmojiTimeline(emojiKey, limit, callback) {
    var url = urlBase + '/api/v1/timelines/emoji/' + emojiKey + '.json';
    authed(request.get(url))
      .query({limit: limit})
      .set('Accept', 'application/json')
      .end(parseResponse(callback));
  }

  function createIRLMoji(emoji, picture, callback) {
    authed(request.post(urlBase + '/api/v1/irlmoji.json'))
      .type('json')
      .send({
        emoji: emoji,
        picture: picture
      })
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', csrf)
      .end(parseResponse(callback));
  }

  function toggleHeart(irlmojiId, callback) {
    var url = urlBase + '/api/v1/irlmoji/id/' + irlmojiId + '/heart.json';
    authed(request.post(url))
      .type('json')
      .send({irlmojiId: irlmojiId})
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', csrf)
      .end(parseResponse(callback));
  }

  function getIRLMoji(irlmojiId, limit, callback) {
    var url = urlBase + '/api/v1/irlmoji/id/' + irlmojiId + '.json';
    authed(request.get(url))
      .query({limit: limit})
      .set('Accept', 'application/json')
      .end(parseResponse(callback));
  }

  function deleteIRLMoji(irlmojiId, callback) {
    var url = urlBase + '/api/v1/irlmoji/id/' + irlmojiId + '.json';
    authed(request.del(url))
      .type('json')
      .send({})
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', csrf)
      .end(parseResponse(callback));
  }

  function getCSRF() {
    return csrf;
  }

  return {
    getCurrentUser: getCurrentUser,
    createUserByTwitter: createUserByTwitter,
    getHomeTimeline: getHomeTimeline,
    getUserTimeline: getUserTimeline,
    getEmojiTimeline: getEmojiTimeline,
    createIRLMoji: createIRLMoji,
    toggleHeart: toggleHeart,
    getIRLMoji: getIRLMoji,
    deleteIRLMoji: deleteIRLMoji,
    getCSRF: getCSRF
  };
}

function parseTimes(item) {
  _.each(['timeCreated', 'timeUpdated'], function(key) {
    if (item[key]) {
      item[key] = new Date(item[key]);
    }
  });
  return item;
}

function parseResponse(callback) {
  return function(error, res) {
    // First, handle any errors
    if (error) {
      return callback(error, res);
    }
    if (res.body ? res.body.error : res.error) {
      return callback(res.body ? res.body.error : res.error, res);
    }
    // Ensure that no non-success results masquarade as successes
    if (res.status !== 200 || !res.body) {
      return callback('Sorry, we encountered an unknown error (code ' +
        res.status + '), please try again.', res);
    }

    // Now parse the data
    var data = {};
    if (res.body.error) {
      data.error = res.body.error;
    }
    if (res.body.user) {
      data.user = parseTimes(res.body.user);
    }
    if (res.body.timeline) {
      data.timeline = _.map(res.body.timeline, parseTimes);
    }
    if (res.body.irlmoji) {
      data.irlmoji = parseTimes(res.body.irlmoji);
    }
    if (res.body.hasMore !== undefined) {
      data.hasMore = res.body.hasMore;
    }
    return callback(error, data);
  };
}

module.exports = {
  setupApi: setupApi
};