var React = require('react/addons');
var _ = require('lodash/dist/lodash.underscore');

var makeRouter = require('./router').makeRouter;
var routes = require('./routes');
var apiBuilder = require('./api');

// So that Chrome developer tools sees that React is installed
window.React = React;
window._ = _;

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
  go: function(path) {
    return router.go(path);
  },
  reload: function() {
    return router.go(this.getPath());
  }
};

var router = makeRouter(
  routes.getRoutes(app),
  routes.getNotFound(app)
);

window.app = app;

router.start();