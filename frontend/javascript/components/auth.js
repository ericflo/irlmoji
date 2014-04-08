/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var common = require('./common');
var utils = require('../utils');

var Auth = React.createClass({
  mixins: [common.SetIntervalMixin],

  handleGetCurrentUserResponse: function(error, res) {
    if (error) {
      // TODO: Decide how best to present this error to the user
      alert('Sorry, there was an error logging you in, try again soon!');
      return;
    }
    if (!res.user) {
      // TODO: Decide how best to present this error to the user
      alert('Sorry, something went wrong and we couldn\'t log you in. ' +
        'Please try again soon.');
      return;
    }
    this.props.onLogin(res.user);
  },

  handleTwitterClick: function(ev) {
    var dialog = utils.openDialog('/auth/twitter', 'twitter-login', 550, 420);
    var interval = this.setInterval(_.bind(function() {
      if (!dialog.closed) {
        return;
      }
      this.clearInterval(interval);
      this.props.app.api.getCurrentUser(this.handleGetCurrentUserResponse);
    }, this), 500);
    return false;
  },

  render: function() {
    var Header = common.Header;
    return (
      <div>
        <Header app={this.props.app} user={this.props.user} />
        <div className="container">
          <div className="social-login">
            <h1>
              Connect with Twitter to Play!<br />
              <small>(We won&rsquo;t ever post anything)</small>
            </h1>
            <a className="btn twitter-connect"
               href="#"
               onClick={this.handleTwitterClick}>
              <span className="social-icon">
                <i className="fa fa-twitter" />
              </span>
              <span className="social-text">
                <small>Connect with</small> Twitter
              </span>
            </a>
            <div className="clearfix"></div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = {
  Auth: Auth
};