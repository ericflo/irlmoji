/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var emoji = require('../emoji');

var Capture = React.createClass({

  handleUploadSuccess: function(file, ev) {
    if (window.NProgress) {
      window.NProgress.done();
    }
    var dropzone = this.refs.dropzone.getDOMNode();
    window.Dropzone.forElement(dropzone).removeFile(file);
    this.props.onPostImageUpload(ev.path);
  },

  handleUploadError: function(file, errMsg) {
    if (window.NProgress) {
      window.NProgress.done();
    }
    var dropzone = this.refs.dropzone.getDOMNode();
    window.Dropzone.forElement(dropzone).removeFile(file);
    alert('Sorry, there was an error uploading your image. Please try again.');
  },

  handleUploadSending: function(file, xhr, formData) {
    if (window.NProgress) {
      window.NProgress.start();
    }
    xhr.setRequestHeader('X-CSRF-Token', this.props.app.api.getCSRF());
  },

  handleClick: function(ev) {
    this.props.app.router.go('/auth', {next: this.props.app.getPath()});
  },

  render: function() {
    if (!this.props.user) {
      return (
        <div className="dropzone capture" onClick={this.handleClick}>
          <i className="fa fa-camera-retro" />
        </div>
      );
    }
    return (
      <ReactDropzone action="/upload"
                     ref="dropzone"
                     className="dropzone capture"
                     acceptedFiles="image/*"
                     uploadMultiple={false}
                     addRemoveLinks={false}
                     createImageThumbnails={false}
                     maxFilesize={7 /*In MB*/}
                     maxFiles={1}
                     success={this.handleUploadSuccess}
                     error={this.handleUploadError}
                     sending={this.handleUploadSending}
                     dictDefaultMessage={'<i class="fa fa-camera-retro"></i>'} />
    );

  }

});

var Emoji = React.createClass({

  getReplaceMode: function() {
    /*
    var ua = this.props.app.getUserAgent();
    if (ua.match(/(iPhone|iPod|iPad|iPhone\s+Simulator)/i)) {
      if (ua.match(/OS\s+[12345]/i)) {
        return 'softbank';
      }
      if (ua.match(/OS\s+[6789]/i)) {
        return 'unified';
      }
    }
    if (ua.match(/Mac OS X 10[._ ][789]/i)) {
      if (!ua.match(/Chrome/i)) {
        return 'unified';
      }
    }
    */
  },

  render: function() {
    var mode = this.getReplaceMode();
    if (mode === 'unified') {
      return <span className="emoji">{emoji.EMOJI_DATA[this.props.emoji][0]}</span>;
    } else if (mode === 'softbank') {
      return <span className="emoji">{emoji.EMOJI_DATA[this.props.emoji][1]}</span>;
    } else if (mode === 'google') {
      return <span className="emoji">{emoji.EMOJI_DATA[this.props.emoji][2]}</span>;
    }
    return this.transferPropsTo(
      <img className="emoji"
           src={'/images/emoji/' + this.props.emoji + '.png'}
           title={emoji.getDisplay(this.props.emoji)} />
    );
  }

});

var EmojiPicker = React.createClass({

  getInitialState: function() {
    return {entry: ''};
  },

  handleChange: function(ev) {
    this.setState({entry: ev.target.value});
  },

  getEmoji: function() {
    var resp = [];
    if (this.state.entry.length === 0) {
      return [];
    }
    _.each(emoji.EMOJI_DATA, function(row, key) {
      if (resp.length > 20) {
        // That's enough, let's just bail
        return;
      }
      for (var i = 0; i < row[3].length; ++i) {
        var name = row[3][i];
        if (name.indexOf(this.state.entry.toLowerCase()) !== -1) {
          resp.push(key);
          break;
        }
      }
    }, this);
    return resp;
  },

  render: function() {
    return this.transferPropsTo(
      <div className="emoji-picker">
        <div className="toolbar">
          <button type="button"
                  className="close"
                  ariaHidden="true"
                  onClick={this.props.onCancel}>&times;</button>
        </div>
        <div className="form-group">
          <input type="text"
                 className="form-control"
                 placeholder="Which emoji was that pic?"
                 onChange={this.handleChange} />
        </div>
        <ul className="emoji-list">
        {_.map(this.getEmoji(), function(key) {
          return (
            <li key={key} onClick={_.partial(this.props.onChoice, key)}>
              <Emoji app={this.props.app} emoji={key} />
              {' :' + emoji.getDisplay(key) + ':'}
            </li>
          );
        }, this)}
        </ul>
      </div>
    );
  }

});

// Utility class to be able to use the Dropzone.js library in a declarative
// React-like way.

if (typeof window !== 'undefined') {
  window.Dropzone.autoDiscover = false;
}

var ReactDropzone = React.createClass({
  componentDidMount: function() {
    // If we can't detect dropzone is installed, mock it out so we at least
    // don't crash the whole program.
    var win = window;
    if (!win || !win.Dropzone) {
      this.dropzone = {destroy: function() {}};
      return;
    }

    // Pull out any properties passed to the component that Dropzone expects,
    // and pass it to the Dropzone constructor.
    var Dropzone = win.Dropzone;
    var options = {};
    for (var opt in Dropzone.prototype.defaultOptions) {
      var prop = this.props[opt];
      if (prop) {
        options[opt] = prop;
        continue;
      }
      options[opt] = Dropzone.prototype.defaultOptions[opt];
    }

    // Grab a reference to it
    this.dropzone = new Dropzone(this.getDOMNode(), options);
  },

  componentWillUnmount: function() {
    this.dropzone.destroy();
    this.dropzone = null;
  },

  render: function() {
    return this.transferPropsTo(<div />);
  }
});

module.exports = {
  Emoji: Emoji,
  EmojiPicker: EmojiPicker,
  Capture: Capture
};