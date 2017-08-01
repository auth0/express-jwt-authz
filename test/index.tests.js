var expect  = require('chai').expect;
var jwtAuthz = require('../lib');

describe('Should error if the inputs are not in the correct format', function(){
  it('when expected scopes are not provided', function(){
    expect(jwtAuthz).to.throw(Error, 
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/);        
  });

  it('when expected scopes are null', function(){
    expect(jwtAuthz.bind(jwtAuthz, null)).to.throw(Error, 
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/);        
  });

  it('when expected scopes are not provided as an array of strings', function(){
    expect(jwtAuthz.bind(jwtAuthz, 'foobar')).to.throw(Error, 
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/);        
  });

  it('when requestObjectKey argument is null', function() {
      expect(jwtAuthz.bind(jwtAuthz, ['read:write'], null)).to.throw(Error, 
      /^Parameter requestObjectKey must be a string value$/);        
  });

  it('when requestObjectKey argument is not a string value', function() {
      expect(jwtAuthz.bind(jwtAuthz, ['read:write'], 23)).to.throw(Error, 
      /^Parameter requestObjectKey must be a string value$/);        
  });

  it('when compareAny argument is null', function() {
      expect(jwtAuthz.bind(jwtAuthz, ['read:write'], 'auth', null)).to.throw(Error, 
      /^Parameter copmareAny must be a boolean value$/); 
  });

  it('when compareAny argument is not a boolean value', function() {
      expect(jwtAuthz.bind(jwtAuthz, ['read:write'], 'auth', 'true')).to.throw(Error, 
      /^Parameter copmareAny must be a boolean value$/); 
  });
});

describe('Should 401 and "Insufficient scope"', function(){
  var expectedScopes = ['read:user','write:user'];

  function createFailedResponse(){
    var params = {};

    return {
      status: function(code){
        params.code = code;
        return this;
      },
      send: function(message){
        params.message = message;
      },
      assert: function(){
        expect(params.code).to.equal(401);
        expect(params.message).to.equal('Insufficient scope');
      }
    };
  }
  
  it('When user scope does not match expectedScopes in default comparison (ANY) mode', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes)({ user: { scope: '' }}, res);
    res.assert;
  });

  it('When user scope does not match expectedScopes when compareANY = true', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes, 'user', true)({ user: { scope: '' }}, res);
    res.assert;
  });

  it('When user scope is not defined and expectedScopes are specified in default comparison (ANY) mode', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes)({ user: {} }, res);
    res.assert;
  });

  it('When user scope is not defined and expectedScopes are specified when compareAny = true', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes, 'user', true)({ user: {} }, res);
    res.assert;
  });

  it('When user scope does not match ALL expectedScopes when compareANY = false', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes, 'user', false)({ user: { scope: 'read:user' } }, res);
    res.assert;
  });

  it('When user scope is not defined and expectedScopes are specified when compareAny = false', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes, 'user', false)({ user: { } }, res);
    res.assert;
  });

  it('When a custom requestObjectKey is specified and that key does not exist on the request object', function(){
    var res = createFailedResponse();
    jwtAuthz(expectedScopes, 'foo')({ user: { scope: 'read:user' } }, res);
    res.assert;
  }); 
});

describe('Should call next function', function(){
  it('When expected scopes are empty', function(done){
    jwtAuthz([])
      (null, null, done);
  });

  it('When user scope matches at least one of expectedScopes in default comparison (ANY) mode', function(done){
    jwtAuthz(['read:user', 'write:user'])
      ({ user: { scope: 'write:user' }}, null, done);
  });

  it('When user scope matches at least one of expectedScopes when compareAny = true', function(done){
    jwtAuthz(['read:user', 'write:user'], 'user', true)
      ({ user: { scope: 'write:user' }}, null, done);
  });

  it('When user scope matches all expectedScopes when compareAny = false', function(done){
    jwtAuthz(['read:user', 'write:user'], 'user', false)
      ({ user: { scope: 'write:user read:user update:user' }}, null, done);
  });

  it('When a custom requestOjectKey is specified and exists on the request object and user scope matches at least one of expectedScopes in default comparison (ANY) mode', function(done){
    jwtAuthz(['read:user', 'write:user'], 'foo')
      ({ 'foo': { scope: 'write:user' }}, null, done);
  });

  it('When a custom requestOjectKey is specified and exists on the request object and user scope matches at least one of expectedScopes when compareAny = true', function(done){
    jwtAuthz(['read:user', 'write:user'], 'foo', true)
      ({ 'foo': { scope: 'write:user' }}, null, done);
  });

  it('When a custom requestOjectKey is specified and exists on the request object and user scope matches all expectedScopes when compareAny = false', function(done){
    jwtAuthz(['read:user', 'write:user'], 'foo', false)
      ({ 'foo': { scope: 'write:user read:user update:user' }}, null, done);
  });
});
