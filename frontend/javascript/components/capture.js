/** @jsx React.DOM */

var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');

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

  render: function() {
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
    )

  }

});

var EmojiPicker = React.createClass({

  handleChange: function(ev) {

  },

  render: function() {
    return (
      <div>
        <a href="#" onClick={this.props.onCancel}>x</a>
        <input type="text" onChange={this.handleChange} />
      </div>
    );
  }

});

// Utility class to be able to use the Dropzone.js library in a declarative
// React-like way.

var ReactDropzone = React.createClass({
  componentDidMount: function() {
    // If we can't detect dropzone is installed, mock it out so we at least
    // don't crash the whole program.
    var win = window;
    if (!win || !win.Dropzone) {
      this.dropzone = {destroy: function() {}};
      return;
    }

    win.Dropzone.autoDiscover = false;

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
  EmojiPicker: EmojiPicker,
  Capture: Capture
};