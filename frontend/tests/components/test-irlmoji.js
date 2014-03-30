var assert = require('assert');
var _ = require('lodash/dist/lodash.underscore');
var React = require('react/addons');
var irlmoji = require('../../javascript/components/irlmoji');
var testUtils = require('../utils');

var ReactTestUtils = React.addons.TestUtils;

describe('An IRLMoji component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var im = {picture: 'asdf', emoji: '1f358'};
    var i = irlmoji.IRLMoji({irlmoji: im});
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(i);
    });
  });

});

describe('An IRLMojiDetail component', function() {

  beforeEach(function() {
    testUtils.initDOM();
  });

  afterEach(function() {
    testUtils.cleanDOM();
  });

  it('should render without error', function() {
    var im = {id: 1, emoji: '1f358'};
    var i = irlmoji.IRLMojiDetail({irlmoji: im});
    assert.doesNotThrow(function() {
      ReactTestUtils.renderIntoDocument(i);
    });
  });

});