var React = require('react/addons');
var _ = require('lodash/dist/lodash.underscore');

var routerBuilder = require('./router/server');
var routesBuilder = require('./routes');
var apiBuilder = require('./api');

// So that Chrome developer tools sees that React is installed
window.React = React;
window._ = _;

var api = apiBuilder.setupApi({
  urlBase: '/api',
  csrf: document.getElementById('csrftoken').value
});

function render(reactElt, opts) {
  opts = opts || {};
  var elt = document.getElementById('react-root');
  document.body.setAttribute('class', opts.bodyClass || '');
  document.title = opts.pageTitle || 'IRLMoji';
  window.currentPage = React.renderComponent(reactElt, elt);
}

var router = routerBuilder.makeRouter(
  routesBuilder.getRoutes(app),
  routesBuilder.getNotFound(app)
);

var app = {
  render: render,
  router: router,
  api: api,
  isServer: function() {
    return false;
  },
  getUrl: function() {
    return '' + window.location;
  },
  getPath: function() {
    return window.location.pathname + window.location.search;
  }
};
window.app = app;

router.start();