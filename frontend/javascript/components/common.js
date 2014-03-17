/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');

var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },

  setInterval: function() {
    var interval = setInterval.apply(null, arguments);
    this.intervals.push(interval);
    return interval;
  },

  clearInterval: function(interval) {
    this.intervals = _.without(this.intervals, interval);
    clearInterval(interval);
  },

  componentWillUnmount: function() {
    _.map(this.intervals, clearInterval);
  }
};

var NotFound = React.createClass({
  render: function() {
    return <p>That page could not be found.</p>;
  }
});

var ServerError = React.createClass({
  render: function() {
    return <p>Sorry, there was an internal server error.</p>;
  }
})

module.exports = {
  SetIntervalMixin: SetIntervalMixin,
  NotFound: NotFound,
  ServerError: ServerError
};