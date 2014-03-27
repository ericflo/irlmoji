var assert = require('assert');
var router = require('../javascript/router');

describe('A basic router', function() {

  it('should accept a list of routes and a 404 page as a constructor', function() {
    var dummy = function() {};
    var routes = [['/', dummy], ['/user/:username', dummy]];
    var r = router.makeRouter(routes, dummy);
    assert.notEqual(r, null);
  });

  it('should call the route function for valid paths', function(done) {
    var index = function() {
      done();
    };
    var r = router.makeRouter([['/', index]], function() {});
    r.route('/');
  });

  it('should call notFound for an invalid path', function(done) {
    var notfound = function() {
      done();
    };
    var r = router.makeRouter([['/', function() {}]], notfound);
    r.route('/asdfasdf');
  });

  it('should pass information from the url to the callback', function(done) {
    var userProfile = function(username) {
      assert.equal(username, 'ericflo');
      done();
    };
    var routes = [['/user/:username', userProfile]];
    var r = router.makeRouter(routes, function() {});
    r.route('/user/ericflo');
  });

});