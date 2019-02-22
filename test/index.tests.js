const expect = require('chai').expect;
const jwtAuthz = require('../lib');

describe('should error', () => {
  it('when expectedScopes is not array', () => {
    expect(jwtAuthz).to.throw(
      Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/
    );
  });
});

describe('should 403 and "Insufficient scope"', () => {
  function createResponse() {
    const params = {};

    return {
      status(code) {
        params.code = code;
        return {
          send(message) {
            params.message = message;
          }
        };
      },
      assert() {
        expect(params.code).to.equal(403);
        expect(params.message).to.equal('Insufficient scope');
      }
    };
  }

  it('when scope in user does not match expectedScopes', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {
        scope: ''
      }
    };

    const params = {};

    const res = createResponse();

    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('by calling the next() callback, when scope in user does not match expectedScopes and `options.failWithError` is `true`', done => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {
        scope: ''
      }
    };
    jwtAuthz(expectedScopes, { failWithError: true })(req, null, error => {
      expect(error.statusCode).to.equal(403);
      expect(error.message).to.equal('Insufficient scope');
      expect(error.error).to.equal('Forbidden');
      done();
    });
  });

  it('when scope in user does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {}
    };

    const res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when user does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {};

    const res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when scope in user is not string and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {}
    };

    const res = createResponse();
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });
});

describe('should call next', () => {
  it('when expectedScopes is empty', done => {
    jwtAuthz([])(null, null, done);
  });

  it('when scope in user has one of expectedScopes', done => {
    const req = {
      user: {
        scope: 'write:user read:user'
      }
    };

    jwtAuthz(['read:user'])(req, null, done);
  });
});
