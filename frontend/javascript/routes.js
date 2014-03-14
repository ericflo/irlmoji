/** @jsx React.DOM */

var React = require('react/addons');

function getRoutes(app) {
  return [
    //['/', requireAuth(index)],
    //['/:username', requireAuth(userProfile)]
  ]
}

function getNotFound(app) {
  app.render(<p>Not Found</p>);
}

module.exports = {
  getRoutes: getRoutes,
  getNotFound: getNotFound
};