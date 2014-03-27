var assert = require('assert');
var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var capture = require('../../javascript/components/capture');
var testUtils = require('../utils');

var ReactTestUtils = React.addons.TestUtils;

describe('An Emoji component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var e = capture.Emoji({emoji: '1f358'});
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(e);
    });
  });

});

describe('An EmojiPicker component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var e = capture.EmojiPicker();
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(e);
    });
  });

});

describe('A capture component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var c = capture.Capture();
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(c);
    });
  });

});