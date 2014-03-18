/** @jsx React.DOM */

var ScreenDimensionsMixin = {
  getInitialState: function() {
    return {
      screenWidth: -1,
      screenHeight: -1
    };
  },

  updateDimensions: function() {
    var w;
    if (this.getScreenDimensionElement) {
      w = this.getScreenDimensionElement();
    } else {
      w = window;
    }
    var d = document;
    var e = d.documentElement;
    var g = d.getElementsByTagName('body')[0];
    var screenWidth = w.innerWidth || e.clientWidth || g.clientWidth;
    var screenHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
    this.setState({screenWidth: screenWidth, screenHeight: screenHeight});
  },

  componentDidMount: function() {
    window.addEventListener('resize', this.updateDimensions);
    this.updateDimensions();
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.updateDimensions);
  }
};

module.exports = {
  ScreenDimensionsMixin: ScreenDimensionsMixin
};