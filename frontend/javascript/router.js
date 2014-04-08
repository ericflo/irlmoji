var qs = require('qs');

var REPLACE_RE = /((:[a-z_$][a-z0-9_$]*))/ig;

function rt(r, c, o, i, m) {
  return {
    regex: r,
    cb: c,
    opt: o || {},
    index: i,
    match: m
  }
}

function processRoutes(routes) {
  var processed = [];
  var i = 0;
  for (var i = 0; i < routes.length; ++i) {
    var route = routes[i];
    var pattern = '^' + route[0].replace(REPLACE_RE, '([^./?#]+)') + '$';
    processed.push(rt(new RegExp(pattern , 'i'), route[1], route[2], i));
  }
  return processed;
}

function Router(routes, notFound) {
  this._routes = processRoutes(routes);
  this._last = null;
  this.notFound = notFound;
}

Router.prototype.callCb = function(route) {
  return route.cb.apply(null, route.match.slice(1));
};

if (typeof window === 'undefined') {
  // We're on the server
  Router.prototype.go = function(path) {
    for (var i = 0; i < this._routes.length; ++i) {
      var route = this._routes[i];
      if (route.opt.clientOnly) {
        continue;
      }
      var match = route.regex.exec(path);
      if (match) {
        return this.callCb({cb: route.cb, match: match});
      }
    }
    return this.notFound();
  };
} else {
  // We're on the client
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

  Router.prototype.go = function(path, query) {
    if (window.history.pushState) {
      window.history.pushState(null, '', path +
        (query ? '?' + qs.stringify(query) : ''));
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
}

function makeRouter(routes, notFound) {
  return new Router(routes, notFound);
}

module.exports = {
    makeRouter: makeRouter
};