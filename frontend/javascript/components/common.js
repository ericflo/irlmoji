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
});

var Header = React.createClass({
  handleClick: function(ev) {
    this.props.app.router.go('/');
    return false;
  },

  aboutSelected: function() {
    return this.props.app.getPath() === '/about';
  },

  render: function() {
    return (
      <div className="header container">
        <h1><a href="/" onClick={this.handleClick}>IRLMoji</a></h1>
        <ul className="opts">
          <li>{this.aboutSelected() ?
            <span>About</span> :
            <a className={'about' + (this.aboutSelected() ? ' selected' : '')}
               href="/about">About</a>}</li>
          {this.props.user ? <li><a href="/logout">Logout</a></li> : null}
        </ul>
      </div>
    );
  }
});

module.exports = {
  SetIntervalMixin: SetIntervalMixin,
  NotFound: NotFound,
  ServerError: ServerError,
  Header: Header
};