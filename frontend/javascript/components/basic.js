/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var common = require('./common');

var About = React.createClass({

  render: function() {
    var Header = common.Header;
    return (
      <div>
        <Header app={this.props.app} user={this.props.user} />
        <div className="container">
          <h2>IRLMoji is a place to post pictures that look like Emoji!</h2>
          <p>
            However, it is also a demo of how to set up a React.js site that
            renders both on the server and the client.
          </p>
        </div>
      </div>
    );
  }

});

module.exports = {
  About: About
};