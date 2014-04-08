var React = require('react/addons');
var _ = require('lodash/dist/lodash.underscore');

var makeRouter = require('./router').makeRouter;
var routes = require('./routes');
var apiBuilder = require('./api');

// So that Chrome developer tools see that React is installed
window.React = React;
window._ = _;

window.BOOTSTRAPPING = true;

var api = apiBuilder.setupApi({
  urlBase: '',
  csrf: document.getElementById('csrftoken').value
});

function render(reactElt, opts) {
  opts = opts || {};
  var elt = document.getElementById('react-root');
  document.body.setAttribute('class', opts.bodyClass || '');
  document.title = opts.title || 'IRLMoji';
  window.currentPage = React.renderComponent(reactElt, elt);
  app.loadingEnded();
}

function registerGoogleAnalyticsPageview() {
  window.ga('create', process.env.GA_ID, process.env.GA_DOMAIN);
  window.ga('send', 'pageview',
    window.location.pathname + window.location.search);
}

var app = {
  render: render,
  api: api,
  getUserId: function() {
    return window.userId || null;
  },
  isServer: function() {
    return false;
  },
  getUrl: function() {
    return '' + window.location;
  },
  getPath: function() {
    return window.location.pathname + window.location.search;
  },
  getUserAgent: _.memoize(function() {
    return navigator.userAgent;
  }),
  getParams: function() {
    var match;
    var pl = /\+/g;
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function(s) {
      return decodeURIComponent(s.replace(pl, ' '));
    };
    var query = window.location.search.substring(1);
    var urlParams = {};
    while (match = search.exec(query)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
  },
  loadingBegan: function() {
    if (window.NProgress && !window.BOOTSTRAPPING) {
      NProgress.start();
    }
  },
  loadingEnded: function() {
    if (window.NProgress) {
      NProgress.done();
    }
    registerGoogleAnalyticsPageview();
    window.BOOTSTRAPPING = false;
  }
};

app.router = makeRouter(
  routes.getRoutes(app),
  routes.getNotFound(app)
);

window.app = app;

app.router.start();