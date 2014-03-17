/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');

var Timeline = React.createClass({

  handleClick: function(ev) {
    this.props.app.router.go('/');
    return false;
  },

  handleChange: function(ev) {
    console.log(ev);
  },

  handlePostImageUpload: function(path) {

  },

  render: function() {
    var Capture = capture.Capture;
    return (
      <div>
        <p>You are logged in! ({this.props.user.username})</p>
        <p><a href="/" onClick={this.handleClick}>Home</a></p>
        <p><a href="/logout">Logout</a></p>
        <Capture app={this.props.app}
                 onPostImageUpload={this.handlePostImageUpload} />
      </div>
    );
  }

});

module.exports = {
  Timeline: Timeline
};