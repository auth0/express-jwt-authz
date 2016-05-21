var expect  = require('chai').expect;
var jwtAuthz = require('../lib');

describe('should error', function(){
  it('when expectedScopes is not array', function(){
    expect(jwtAuthz).to.throw(Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/);
  });
});

describe('should 401 and "Insufficient scope"', function(){
  function createResponse(){
    var params = {};

    return {
      send: function(code, message){
        params.code = code;
        params.message = message;
      },
      assert: function(){
        expect(params.code).to.equal(401);
        expect(params.message).to.equal('Insufficient scope');
      }
    };
  }

  it('when scope in user does not match expectedScopes', function(){
    var expectedScopes = ['read:user'];
    var req = {
      user: {
        scope: ''
      }
    };

    var params = {};

    var res = createResponse();

    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when scope in user does not exist and expectedScopes are not empty', function(){
    var expectedScopes = ['read:user'];
    var req = {
      user: {}
    };

    var res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when user does not exist and expectedScopes are not empty', function(){
    var expectedScopes = ['read:user'];
    var req = {};

    var res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when scope in user is not string and expectedScopes are not empty', function(){
    var expectedScopes = ['read:user'];
    var req = {
      user: {}
    };

    var res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });
});

describe('should call next', function(){
  it('when expectedScopes is empty', function(done){
    jwtAuthz([])(null, null, done);
  });

  it('when scope in user has one of expectedScopes', function(done){
    var req = {
      user: {
        scope: 'write:user read:user'
      }
    };

    jwtAuthz(['read:user'])(req, null, done);
  });
});