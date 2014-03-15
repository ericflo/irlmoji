"use strict";

var connect = require('connect');
var crypto = require('crypto');
var fs = require('fs');
var httpProxy = require('http-proxy');
var React = require('react/addons');
var uuid = require('node-uuid');
var _ = require('lodash/dist/lodash.underscore');

var makeRouter = require('./build/javascript/router').makeRouter;
var routes = require('./build/javascript/routes');
var apiBuilder = require('./build/javascript/api');

var ENV_WARNING = ('WARNING: Could not read env.json file, so unless ' +
  'you\'ve set the environment variables manually, the app will not work.');

(function readEnv() {
  var fileData;
  try {
    fileData = fs.readFileSync('env.json');
  } catch (e) {
    if (e.code === 'ENOENT') {
      return console.log(ENV_WARNING);
    }
  }
  var data;
  try {
    data = JSON.parse(fileData);
  } catch (e) {
    return console.log(ENV_WARNING);
  }
  _.each(data, function(value, key) {
    process.env[key] = value;
  }, this);
})();

var NODE_ENV = process.env['NODE_ENV'];
var PROD = NODE_ENV === 'production';
var IRLMOJI_API_BASIC_USER = process.env['IRLMOJI_API_BASIC_USER'];
var IRLMOJI_COOKIE_SECRET = process.env['IRLMOJI_COOKIE_SECRET'];
var IRLMOJI_PROXY_BACKEND_URL = process.env['IRLMOJI_PROXY_BACKEND_URL'];
var TWITTER_CONSUMER_KEY = process.env['TWITTER_CONSUMER_KEY'];
var TWITTER_CONSUMER_SECRET = process.env['TWITTER_CONSUMER_SECRET'];
var TWITTER_CALLBACK_URL = process.env['TWITTER_CALLBACK_URL'];
var FRONTEND_URL = process.env['FRONTEND_URL'];
var API_URL = process.env['API_URL'];

var PAGE_TEMPLATE = fs.readFileSync('frontend/page.html');
var PROXY = httpProxy.createServer({target: IRLMOJI_PROXY_BACKEND_URL});
var HASH_CACHE = {};

function getHashForFilename(fn) {
  var resp = HASH_CACHE[fn];
  if (resp) {
    return resp;
  }
  var hsh = crypto.createHash('sha1');
  hsh.update(fs.readFileSync(fn));
  HASH_CACHE[fn] = hsh.digest('hex');
  return HASH_CACHE[fn];
}

function fixConnectCookieSessionHandler(req, res, next) {
  // This user won't have to log in for a year
  req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
  return next();
}

function guestHandler(req, res, next) {
  var guestId = req.session.gid;
  if (!guestId) {
    req.session.gid = '' + uuid.v1();
  }
  return next();
}

function apiProxyHandler(req, res, next) {
  if (req.url.indexOf('/api') !== 0) {
    return next();
  }
  var uid = req.session.uid || 0;
  var gid = req.session.gid;
  var userPass = new Buffer(IRLMOJI_API_BASIC_USER + ':' + uid + '_' + gid,
    'ascii');
  req.headers.authorization = 'Basic ' + userPass.toString('base64');
  delete req.headers.cookie;
  PROXY.web(req, res);
}

function logoutHandler(req, res, next) {
  if (req.url !== '/logout') {
    return next();
  }
  req.session.uid = null;
  res.writeHead(302, {'Location': '/'});
  res.end();
}

function twitterAuthHandler(req, res, next) {
  if (req.url.indexOf('/auth/twitter') !== 0) {
    return next();
  }
  var oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    '1.0A',
    TWITTER_CALLBACK_URL,
    'HMAC-SHA1'
  );
  if (req.url.indexOf('/auth/twitter/callback') === 0) {
    var oauthToken = req.session.oauthRequestToken;
    var oauthTokenSecret = req.session.oauthRequestTokenSecret;
    oauth.getOAuthAccessToken(oauthToken, oauthTokenSecret,
      req.query.oauth_verifier, function(error, oauthAccessToken,
                                         oauthAccessTokenSecret, results) {
      if (error) {
        console.log(
          'Error verifying your Twitter credentials: ' + util.inspect(error));
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('<script>window.close()</script>');
        return;
      }
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

      var api = apiBuilder.setupApi({urlBase: API_URL, csrf: req.csrfToken()});
      api.createUserByTwitter(oauthAccessToken, oauthAccessTokenSecret, _.bind(function(error, resp) {
        req.session.uid = resp.body.user.id;
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('<script>window.close()</script>');
      }, this));
    });
  } else {
    oauth.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret,
                                        results) {
      if (error) {
        console.log('Error connecting to Twitter: ' + util.inspect(error));
        res.writeHead(302, {'Location': '/auth/twitter'});
        res.end();
        return;
      }
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.writeHead(302, {'Location':
        'https://twitter.com/oauth/authorize?oauth_token=' + oauthToken});
      res.end();
    });
  }
}

function reactHandler(req, res, next) {
  var api = apiBuilder.setupApi({urlBase: API_URL, csrf: req.csrfToken()});

  function render(reactElt, opts) {
    opts = opts || {};
    var scriptPath = 'javascript/compiled' + (PROD ? '.min' : '') + '.js';
    var scriptVersion = getHashForFilename('build/' + scriptPath);
    var stylePath = 'styles/main' + (PROD ? '.min' : '') + '.css';
    var styleVersion = getHashForFilename('build/' + stylePath);
    var sub = {
      EXTRA_HEAD: opts.extraHead || '',
      BODY_CLASS: opts.bodyClass || '',
      BODY_CONTENT: React.renderComponentToString(reactElt),
      USER_ID: req.session.uid || 'null',
      CSRF_TOKEN: req.csrfToken(),
      SCRIPT_PATH: '/' + scriptPath + '?v=' + scriptVersion,
      STYLE_PATH: '/' + stylePath + '?v=' + styleVersion,
      PAGE_TITLE: opts.pageTitle || 'IRLMoji'
    };
    var re = new RegExp('{{ (' + _.keys(sub).join('|') + ') }}', 'g');
    res.writeHead(opts.statusCode || 200, {'Content-Type': 'text/html'});
    res.end(('' + PAGE_TEMPLATE).replace(re, function(m) {
      return sub[m.substring(3, m.length - 3)];
    }));
  }

  var app = {
    render: render,
    api: api,
    getUserId: function() {
      return req.session.uid || null;
    },
    isServer: function() {
      return true;
    },
    getUrl: function() {
      var proto = req.headers['x-forwarded-proto'] || 'http';
      return proto + '://' + req.headers.host + req.url;
    },
    getPath: function() {
      return req.url;
    }
  }

  var router = makeRouter(
    routes.getRoutes(app),
    routes.getNotFound(app)
  );

  router.route(app.getPath());
}

// Set up the application and run it
var server = connect()
  .use(connect.logger())
  .use(connect.static(__dirname + '/build'))
  .use(connect.cookieParser())
  .use(connect.cookieSession({
    secret: IRLMOJI_COOKIE_SECRET,
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in seconds, doesn't work tho
      proxy: true
    }
  }))
  .use(fixConnectCookieSessionHandler)
  .use(guestHandler)
  .use(connect.csrf())
  .use(apiProxyHandler)
  .use(connect.urlencoded())
  .use(connect.query())
  .use(connect.json());
  // AUTH HANDLER
server = server
  .use(logoutHandler)
  .use(reactHandler)
  .listen(5000);