var base = require('./base');

var Router = base.Router;
var rt = base.rt;

Router.prototype.getRouteForPath = function(path) {
  for (var i = 0; i < this._routes.length; ++i) {
    var route = this._routes[i];
    if (route.opt.serverOnly) {
      continue;
    }
    var match = route.regex.exec(path);
    if (match) {
      this._last = rt(route.regex, route.cb, route.opt, route.index, match);
      return this._last;
    }
  }
};

Router.prototype.handle = function() {
  if (window.history.pushState) {
    var route = this.getRouteForPath(window.location.pathname, false);
    if (!route) {
      // TODO: Add a warning or invariant or something here
      return;
    }
    this.callCb(route);
  }
};

Router.prototype.start = function() {
  window.addEventListener('popstate', this.handle.bind(this));
  this.handle();
};

Router.prototype.go = function(path) {
  if (window.history.pushState) {
    window.history.pushState(null, '', path);
    var route = this.getRouteForPath(path, false);
    if (!route) {
      return this.notFound();
    }
    this.callCb(route);
  } else {
    window.location = path;
  }
};

Router.prototype.reload = function() {
  if (this._last) {
    this.callCb(this._last);
  } else {
    window.location.reload();
  }
};

function makeRouter(routes, notFound) {
  return new Router(routes, notFound);
}

module.exports = {
    makeRouter: makeRouter
};