/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');

var Timeline = React.createClass({

  getInitialState: function() {
    return {imagePath: null};
  },

  handleClick: function(ev) {
    this.props.app.router.go('/');
    return false;
  },

  handlePostImageUpload: function(path) {
    this.setState({imagePath: path});
  },

  handleEmojiChoice: function(emoji) {
    // TODO
  },

  handleEmojiCancel: function(ev) {
    this.setState({imagePath: null});
    return false;
  },

  render: function() {
    var Capture = capture.Capture;
    var EmojiPicker = capture.EmojiPicker;
    return (
      <div>
        <p>You are logged in! ({this.props.user.username})</p>
        <p><a href="/" onClick={this.handleClick}>Home</a></p>
        <p><a href="/logout">Logout</a></p>
        {this.state.imagePath ?
          <EmojiPicker app={this.props.app}
                       onCancel={this.handleEmojiCancel}
                       onChoice={this.handleEmojiChoice} /> :
          <Capture app={this.props.app}
                   onPostImageUpload={this.handlePostImageUpload} />}
      </div>
    );
  }

});

module.exports = {
  Timeline: Timeline
};