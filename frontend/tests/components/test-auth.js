var assert = require('assert');
var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var auth = require('../../javascript/components/auth');
var testUtils = require('../utils');

var ReactTestUtils = React.addons.TestUtils;

describe('An auth page', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var a = auth.Auth({app: {}, onLogin: function() {}});
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(a);
    });
  });

  it('should open a popup when the user clicks on it', function() {
    var a = auth.Auth({app: {}, onLogin: function() {}});
    ReactTestUtils.renderIntoDocument(a);
    var link = ReactTestUtils.findRenderedDOMComponentWithTag(a, 'a');
    assert.doesNotThrow(function() {
      ReactTestUtils.Simulate.click(link);
    });
  });

});