var Router = require('./base').Router;

Router.prototype.route = function(path) {
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
};

function makeRouter(routes, notFound) {
  return new Router(routes, notFound);
}

module.exports = {
    makeRouter: makeRouter
};