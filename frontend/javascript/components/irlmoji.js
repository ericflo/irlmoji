/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');
var common = require('./common');
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

  handleImageClick: function(ev) {
    this.props.app.router.go('/irlmoji/' + this.props.irlmoji.id);
    return false;
  },

  handleEmojiTap: function(kind, im, ev) {
    if (kind === 'heart' && !this.props.user) {
      this.props.app.router.go('/auth', {next: this.props.app.getPath()});
      return false;
    }
    this.props.onEmojiTap(kind, im, ev);
    return false;
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
                   onClick={_.partial(this.handleEmojiTap, 'user', im)} />
              <Emoji app={this.props.app}
                     emoji={im.emoji}
                     onClick={_.partial(this.handleEmojiTap, 'picture', im)} />
              <span className="heart icon"
                    onClick={_.partial(this.handleEmojiTap, 'heart', im)}>
                <i className={'fa fa-heart' + (im.hearted ? '' : '-o hearted')}></i>
              </span>
              <span className="heart count"
                    onClick={_.partial(this.handleEmojiTap, 'heart', im)}>
                <span className="num">{im.heartCount}</span>
              </span>
              {canDelete ?
                <span className="delete"
                      onClick={_.partial(this.handleEmojiTap, 'delete', im)}>
                  <i className="fa fa-trash-o" />
                </span> : null}
            </div> : []}
        </ReactCSSTransitionGroup>
        <img className="picture"
             src={this.getPicture()}
             onLoad={this.handleImageLoad}
             onClick={this.handleImageClick}
             alt={'Picture for ' + emoji.getDisplay(im.emoji)} />
      </div>
    );
  }

});

var IRLMojiDetail = React.createClass({

  handleDeleteEmojiResponse: function(error, resp) {
    if (error !== null) {
      // TODO: Decide how to really show this
      return alert(error);
    }
  },

  handleToggleHeartResponse: function(error, resp) {
    if (error !== null) {
      // TODO: Decide how to really show this
      return alert(error);
    }
    this.setProps({irlmoji: _.extend({}, this.props.irlmoji, resp.irlmoji)});
    this.props.app.router.reload();
  },

  handleUserClick: function(user, ev) {
    this.props.app.router.go('/user/' + user.username);
    return false;
  },

  handleEmojiTap: function(kind, im, ev) {
    if (kind === 'user') {
      this.props.app.router.go('/user/' + im.user.username);
    } else if (kind === 'picture') {
      this.props.app.router.go('/timeline/emoji/' + emoji.getDisplay(im.emoji));
    } else if (kind === 'delete') {
      var sure = confirm('Are you sure you want to delete this IRLMoji?');
      if (sure) {
        this.props.app.api.deleteIRLMoji(im.id, this.handleDeleteEmojiResponse);
        this.props.app.router.go('/');
      }
    } else if (kind === 'heart') {
      this.props.app.api.toggleHeart(im.id, this.handleToggleHeartResponse);
      if (im.hearted) {
        this.setProps({irlmoji: _.extend({}, this.props.irlmoji, {
          hearted: false,
          heartCount: im.heartCount - 1
        })});
      } else {
        this.setProps({irlmoji: _.extend({}, this.props.irlmoji, {
          hearted: true,
          heartCount: im.heartCount + 1
        })});
      }
    }
    return false;
  },

  render: function() {
    var Header = common.Header;
    var im = this.props.irlmoji;
    return (
      <div>
        <Header app={this.props.app} user={this.props.user} />
        <div className="irlmoji-list">
          <IRLMoji key={im.id}
                   irlmoji={im}
                   app={this.props.app}
                   user={this.props.user}
                   onEmojiTap={this.handleEmojiTap} />
        </div>
        <ul className="hearts">
          {_.map(im.hearts || [], function(heart, i) {
            return (
              <li key={i}>
                <i className="fa fa-heart" />{' '}
                <a href={'/user/' + heart.user.username}
                   onClick={_.partial(this.handleUserClick, heart.user)}>
                   {heart.user.username}
                </a>
              </li>
            );
          }, this)}
        </ul>
      </div>
    );
  }

});

module.exports = {
  IRLMoji: IRLMoji,
  IRLMojiDetail: IRLMojiDetail
};