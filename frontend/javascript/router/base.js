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

module.exports = {
  Router: Router,
  rt: rt
}