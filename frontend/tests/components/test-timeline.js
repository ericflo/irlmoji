var assert = require('assert');
var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var timeline = require('../../javascript/components/timeline');
var testUtils = require('../utils');

var ReactTestUtils = React.addons.TestUtils;

describe('A Timeline component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var app = {getPath: function() { return '/'; }};
    var t = timeline.Timeline({app: app});
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(t);
    });
  });

});