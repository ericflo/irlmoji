/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('./capture');
var common = require('./common');
var irlmoji = require('./irlmoji');
var emoji = require('../emoji');

var Timeline = React.createClass({

  getInitialState: function() {
    return {
      imagePath: null,
      moreLoading: false
    };
  },

  handlePostImageUpload: function(path) {
    this.setState({imagePath: path});
  },

  handleCreateIRLMojiResponse: function(error, data) {
    if (error) {
      alert(error);
      return;
    }
    this.props.app.router.reload();
  },

  handleEmojiChoice: function(emojiKey) {
    var picture = this.state.imagePath;
    this.setState({imagePath: null}, _.bind(function() {
      this.props.app.api.createIRLMoji(emojiKey, picture,
        this.handleCreateIRLMojiResponse);
    }, this));
    return false;
  },

  handleEmojiCancel: function(ev) {
    this.setState({imagePath: null});
    return false;
  },

  getIrlmojiIndex: function(irlmojiId) {
    var timeline = this.props.timeline;
    for (var i = 0; i < timeline.length; ++i) {
      if (timeline[i].id === irlmojiId) {
        return i;
      }
    }
    return -1;
  },

  updateIrlmojiAtIndex: function(idx, newProps) {
    var timeline = this.props.timeline.slice(0);
    timeline[idx] = _.extend(timeline[idx], newProps);
    this.setProps({timeline: timeline});
  },

  removeIrlmojiAtIndex: function(idx) {
    var timeline = this.props.timeline.slice(0);
    timeline.splice(idx, 1);
    this.setProps({timeline: timeline});
  },

  handleToggleHeartResponse: function(error, resp) {
    if (error !== null) {
      // TODO: Decide how to really show this
      return alert(error);
    }
    var idx = this.getIrlmojiIndex(resp.irlmoji.id);
    this.updateIrlmojiAtIndex(idx, resp.irlmoji);
  },

  handleDeleteEmojiResponse: function(error, resp) {
    if (error !== null) {
      // TODO: Decide how to really show this
      return alert(error);
    }
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
        var idx = this.getIrlmojiIndex(im.id);
        this.removeIrlmojiAtIndex(idx);
      }
    } else if (kind === 'heart') {
      this.props.app.api.toggleHeart(im.id, this.handleToggleHeartResponse);
      var idx = this.getIrlmojiIndex(im.id);
      if (im.hearted) {
        this.updateIrlmojiAtIndex(idx,
          {hearted: false, heartCount: im.heartCount - 1});
      } else {
        this.updateIrlmojiAtIndex(idx,
          {hearted: true, heartCount: im.heartCount + 1});
      }
    }
    return false;
  },

  handleLoadMore: function() {
    var self = this;
    var preLength = this.props.timeline.length;
    this.setState({moreLoading: true}, function() {
      var nextLimit = self.props.limit + 20;
      self.props.timelineFunc(nextLimit, function(error, resp) {
        if (error !== null) {
          alert(error);
          return;
        }
        if (!self.isMounted()) {
          return;
        }
        self.setState({moreLoading: false}, function() {
          self.setProps({
            timeline: resp.timeline,
            limit: nextLimit,
            hasMore: resp.hasMore
          });
        });
      });
    });
    return false;
  },

  renderMoreLoader: function() {
    if (!this.props.hasMore) {
      return null;
    }
    if (this.state.moreLoading) {
      return <span className="more">Loading...</span>;
    }
    return <a href="#" className="more" onClick={this.handleLoadMore}>Load more</a>;
  },

  render: function() {
    var Capture = capture.Capture;
    var EmojiPicker = capture.EmojiPicker;
    var IRLMoji = irlmoji.IRLMoji;
    var Header = common.Header;
    if (this.state.imagePath) {
      return (
        <EmojiPicker app={this.props.app}
                     onCancel={this.handleEmojiCancel}
                     onChoice={this.handleEmojiChoice} />
      );
    }
    return (
      <div>
        <Header app={this.props.app} user={this.props.user} />
        <div className="irlmoji-list">
          {_.map(this.props.timeline, function(im) {
            return (
              <IRLMoji key={im.id}
                       irlmoji={im}
                       app={this.props.app}
                       user={this.props.user}
                       onEmojiTap={this.handleEmojiTap} />
            );
          }, this)}
        </div>
        {this.renderMoreLoader()}
        <Capture app={this.props.app}
                 user={this.props.user}
                 onPostImageUpload={this.handlePostImageUpload} />
      </div>
    );
  }

});

module.exports = {
  Timeline: Timeline
};