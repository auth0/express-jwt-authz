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
  function createResponse(expectedScopes = []) {
    const params = {};
    let header;
    let content;

    return {
      status(code) {
        params.code = code;
        return {
          send(message) {
            params.message = message;
          }
        };
      },
      append(_header, _content) {
        header = _header;
        content = _content;
      },
      assert() {
        expect(params.code).to.equal(403);
        expect(params.message).to.equal('Insufficient scope');
        expect(header).to.equal('WWW-Authenticate');
        expect(content.split('scope="')[1].split('"')[0]).to.equal(
          expectedScopes.join(' ')
        );
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

    const res = createResponse(expectedScopes);

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

  it('when user.scope does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {}
    };

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when using a customScopeKey and invalid scopes', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {}
    };

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes, { customScopeKey: 'permissions' })(req, res);

    res.assert();
  });

  it('when user.scope is missing some of the expectedScopes and options.checkAllScopes is true', () => {
    const expectedScopes = ['read:user', 'write:user', 'delete:user'];
    const req = {
      user: {
        // This user is missing 'delete:user'
        scope: 'read:user write:user'
      }
    };

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes, { checkAllScopes: true })(req, res);

    res.assert();
  });

  it('when user does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {};

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when user.scope is an empty array and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {
        scope: []
      }
    };

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });

  it('when user.scope is undefined and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];
    const req = {
      user: {}
    };

    const res = createResponse(expectedScopes);
    jwtAuthz(expectedScopes)(req, res);

    res.assert();
  });
});

describe('should call next', () => {
  it('when expectedScopes is empty', done => {
    jwtAuthz([])(null, null, done);
  });

  it('when user.scope is a string and contains the expectedScope', done => {
    const req = {
      user: {
        scope: 'write:user read:user'
      }
    };

    jwtAuthz(['read:user'])(req, null, done);
  });

  it('when user.scope is an array and contains the expectedScope', done => {
    const req = {
      user: {
        scope: ['write:user', 'read:user']
      }
    };

    jwtAuthz(['read:user'])(req, null, done);
  });

  it('when user.scope contains only one of the expectedScopes', done => {
    const req = {
      user: {
        scope: 'write:user'
      }
    };

    jwtAuthz(['read:user', 'write:user'])(req, null, done);
  });

  it('when user.scope has all the expectedScopes and options.checkAllScopes is `true`', done => {
    const req = {
      user: {
        scope: ['read:user', 'write:user', 'delete:user']
      }
    };

    jwtAuthz(['read:user', 'write:user'], { checkAllScopes: true })(
      req,
      null,
      done
    );
  });

  it('when using a customScopeKey', done => {
    const req = {
      user: {
        permissions: 'write:user'
      }
    };

    jwtAuthz(['read:user', 'write:user'], { customScopeKey: 'permissions' })(
      req,
      null,
      done
    );
  });

  it('when using a customScopeKey that is an array', done => {
    const req = {
      user: {
        permissions: ['write:user']
      }
    };

    jwtAuthz(['read:user', 'write:user'], { customScopeKey: 'permissions' })(
      req,
      null,
      done
    );
  });
});
