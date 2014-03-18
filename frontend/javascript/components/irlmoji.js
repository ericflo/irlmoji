/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');
var mixins = require('./mixins');
var emoji = require('../emoji');

var IRLMoji = React.createClass({

  mixins: [mixins.ScreenDimensionsMixin],

  getScreenDimensionElement: function() {
    return this.getDOMNode();
  },

  getUserPic: function() {
    return this.props.irlmoji.user.pic.replace('_normal', '');
  },

  getPicture: function() {
    // TODO: This could be more elegant
    var orig = ('//' + process.env.AWS_S3_BUCKET_NAME + '.s3.amazonaws.com/' +
      this.props.irlmoji.picture);
    var resized = orig.replace('original', 'resized').replace(/\..{1,5}$/, '.jpg');
    return resized.replace('.jpg', '/500.jpg');
  },

  render: function() {
    var Emoji = capture.Emoji;
    var im = this.props.irlmoji;
    return (
      <div className="irlmoji">
        <img className="userpic"
             src={this.getUserPic()}
             alt={im.user.username}
             onClick={_.partial(this.props.onEmojiTap, 'user', im)} />
        <Emoji app={this.props.app}
               emoji={im.emoji}
               onClick={_.partial(this.props.onEmojiTap, 'picture', im)} />
        <img className="picture"
             src={this.getPicture()}
             alt={'Picture for ' + emoji.getDisplay(im.emoji)} />
      </div>
    );
  }

});

module.exports = {
  IRLMoji: IRLMoji
};