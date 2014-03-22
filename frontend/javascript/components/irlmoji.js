/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');
var emoji = require('../emoji');

var IRLMoji = React.createClass({

  getInitialState: function() {
    return {imageLoaded: false};
  },

  componentDidMount: function() {
    // This is a backup in case for whatever reason the image doesn't load
    this.timer = window.setTimeout(_.bind(function() {
      this.setState({imageLoaded: true});
    }, this), 500);
  },

  componentWillUnmount: function() {
    if (typeof window !== 'undefined') {
      window.clearTimeout(this.timer);
    }
  },

  getUserPic: function() {
    return this.props.irlmoji.user.pic
      .replace('_normal', '')
      .replace('http:', 'https:');
  },

  getPicture: function() {
    // TODO: This could be more elegant
    var orig = ('//' + process.env.AWS_S3_BUCKET_NAME + '.s3.amazonaws.com/' +
      this.props.irlmoji.picture);
    var resized = orig.replace('original', 'resized').replace(/\..{1,5}$/, '.jpg');
    return resized.replace('.jpg', '/500.jpg');
  },

  handleImageLoad: function() {
    this.setState({imageLoaded: true});
  },

  render: function() {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    var Emoji = capture.Emoji;
    var im = this.props.irlmoji;
    var canDelete = (
      (this.props.user && this.props.user.isAdmin) ||
      (this.props.user && this.props.user.id === im.user.id)
    );
    return (
      <div className="irlmoji">
        <ReactCSSTransitionGroup transitionName="actions">
          {this.state.imageLoaded ?
            <div className="actions">
              <img className="userpic"
                   src={this.getUserPic()}
                   alt={im.user.username}
                   onClick={_.partial(this.props.onEmojiTap, 'user', im)} />
              <Emoji app={this.props.app}
                     emoji={im.emoji}
                     onClick={_.partial(this.props.onEmojiTap, 'picture', im)} />
              <span className="heart icon"
                    onClick={_.partial(this.props.onEmojiTap, 'heart', im)}>
                <i className={'fa fa-heart' + (im.hearted ? '' : '-o hearted')}></i>
              </span>
              <span className="heart count"
                    onClick={_.partial(this.props.onEmojiTap, 'heart', im)}>
                <span className="num">{im.heartCount}</span>
              </span>
              {canDelete ?
                <span className="delete"
                      onClick={_.partial(this.props.onEmojiTap, 'delete', im)}>
                  <i className="fa fa-trash-o" />
                </span> : null}
            </div> : []}
        </ReactCSSTransitionGroup>
        <img className="picture"
             src={this.getPicture()}
             onLoad={this.handleImageLoad}
             alt={'Picture for ' + emoji.getDisplay(im.emoji)} />
      </div>
    );
  }

});

module.exports = {
  IRLMoji: IRLMoji
};