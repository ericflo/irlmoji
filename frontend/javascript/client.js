var React = require('react/addons');
var _ = require('lodash/dist/lodash.underscore');

var makeRouter = require('./router').makeRouter;
var routes = require('./routes');
var apiBuilder = require('./api');

// So that Chrome developer tools sees that React is installed
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
  document.title = opts.pageTitle || 'IRLMoji';
  window.currentPage = React.renderComponent(reactElt, elt);
  app.loadingEnded();
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
  getUserAgent: function() {
    return navigator.userAgent;
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
    window.BOOTSTRAPPING = false;
  }
};

app.router = makeRouter(
  routes.getRoutes(app),
  routes.getNotFound(app)
);

window.app = app;

app.router.start();