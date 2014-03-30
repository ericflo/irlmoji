/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var async = require('async');
var common = require('./components/common');
var auth = require('./components/auth');
var basic = require('./components/basic');
var Timeline = require('./components/timeline').Timeline;
var IRLMojiDetail = require('./components/irlmoji').IRLMojiDetail;
var emoji = require('./emoji');
var meta = require('./meta');

var DEFAULT_LIMIT = 10;

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
    console.log('inside');
    app.router.reload();
  }} />);
}

// Utilities

function cachedFetch(funcs, callback) {
  if (typeof window !== 'undefined' && window.BOOTSTRAPPING &&
      window.bootstrapData) {
    return callback(null, window.bootstrapData);
  }
  return async.parallel(funcs, callback);
}

// The handlers themselves

function handleIndex(app, user) {
  var timelineFunc = app.api.getHomeTimeline;
  var funcs = {timeline: _.partial(timelineFunc, DEFAULT_LIMIT)};
  cachedFetch(funcs, function(error, data) {
    if (error) {
      return handleServerError(app);
    }
    app.render(<Timeline app={app}
                         user={user}
                         timeline={data.timeline.timeline}
                         hasMore={data.timeline.hasMore}
                         limit={DEFAULT_LIMIT}
                         timelineFunc={timelineFunc} />, {
      title: 'Welcome : IRLMoji',
      user: user,
      data: data
    });
  });
}

function handleUserProfile(app, user, username) {
  var timelineFunc = _.partial(app.api.getUserTimeline, username);
  var funcs = {timeline: _.partial(timelineFunc, DEFAULT_LIMIT)};
  cachedFetch(funcs, function(error, data) {
    if (error) {
      return handleServerError(app);
    }
    app.render(<Timeline app={app}
                         user={user}
                         timeline={data.timeline.timeline}
                         hasMore={data.timeline.hasMore}
                         limit={DEFAULT_LIMIT}
                         timelineFunc={timelineFunc} />, {
      title: username + ' : IRLMoji',
      user: user,
      data: data,
    });
  });
}

function handleTimelineEmoji(app, user, displayEmoji) {
  var emojiKey = emoji.keyFromDisplay(displayEmoji);
  var timelineFunc = _.partial(app.api.getEmojiTimeline, emojiKey);
  var funcs = {timeline: _.partial(timelineFunc, DEFAULT_LIMIT)};
  cachedFetch(funcs, function(error, data) {
    if (error) {
      return handleServerError(app);
    }
    app.render(<Timeline app={app}
                         user={user}
                         timeline={data.timeline.timeline}
                         hasMore={data.timeline.hasMore}
                         limit={DEFAULT_LIMIT}
                         timelineFunc={timelineFunc} />, {
      title: displayEmoji + ' : IRLMoji',
      user: user,
      data: data
    });
  });
}

function handleIrlmoji(app, irlmojiId) {
  var irlmojiFunc = _.partial(app.api.getIRLMoji, irlmojiId);
  var funcs = {
    irlmoji: _.partial(irlmojiFunc, DEFAULT_LIMIT),
    user: app.api.getCurrentUser
  };
  cachedFetch(funcs, function(error, data) {
    if (error) {
      return handleServerError(app);
    }
    var displayEmoji = emoji.getDisplay(data.irlmoji.irlmoji.emoji);
    app.render(<IRLMojiDetail app={app}
                              user={data.user.user}
                              irlmoji={data.irlmoji.irlmoji}
                              limit={DEFAULT_LIMIT}
                              irlmojiFunc={irlmojiFunc} />, {
      title: displayEmoji + ' : IRLMoji',
      extraHead: meta.getDetailMeta(data.irlmoji.irlmoji, app.getUrl()),
      data: data
    });
  });
}

function handleAbout(app) {
  var funcs = {user: app.api.getCurrentUser};
  cachedFetch(funcs, function(error, data) {
    var About = basic.About;
    app.render(<About app={app} user={data.user.user} />, {
      title: 'About IRLMoji',
      data: data
    });
  });
}

// Generates the routes and binds function partials

function getRoutes(app) {
  return [
    ['/', prepareHandler(app, handleIndex, true)],
    ['/about', prepareHandler(app, handleAbout), {serverOnly: true}],
    ['/user/:username', prepareHandler(app, handleUserProfile, true)],
    ['/timeline/emoji/:displayEmoji', prepareHandler(app, handleTimelineEmoji, true)],
    ['/irlmoji/:irlmojiId', prepareHandler(app, handleIrlmoji)]
  ]
}

function getNotFound(app) {
  return _.partial(handleNotFound, app);
}

// Wrappers for the handlers to prepare them with app instances, auth, and loaders

function loadingBegan(app) {
  if (!app.isServer()) {
    app.loadingBegan();
  }
}

function makeAuthlessHandler(app, func) {
  return function() {
    loadingBegan(app);
    return _.partial(func, app).apply(null, arguments);
  };
}

function makeBootstrapHandler(app, func) {
  return function() {
    loadingBegan(app);
    return _.partial(func, app, window.bootstrapUser).apply(null, arguments);
  };
}

function makeAuthedHandler(app, func) {
  return function() {
    var args = arguments;
    app.api.getCurrentUser(function(err, res) {
      loadingBegan(app);
      if (err) {
        return handleServerError(app);
      }
      if (!res.user) {
        return handleAuth(app);
      }
      return _.partial(func, app, res.user).apply(null, args);
    });
  };
}

function prepareHandler(app, func, authRequired) {
  if (!authRequired) {
    return makeAuthlessHandler(app, func);
  }
  if (typeof window !== 'undefined' && window.BOOTSTRAPPING &&
    window.bootstrapUser) {
    return makeBootstrapHandler(app, func);
  }
  return makeAuthedHandler(app, func);
}

module.exports = {
  getRoutes: getRoutes,
  getNotFound: getNotFound
};