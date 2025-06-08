import * as express from 'express';
import { expect } from 'chai';
import {
  jwtAuthz,
  AuthzError,
  ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
  ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY,
  ERROR_MSG_INSUFFICIENT_SCOPE,
  createMissingPayloadMessage,
} from '../src';
import { MockResponse, createRequest, createResponse } from 'node-mocks-http';

function assertErrorResponseIs403(
  res: MockResponse<express.Response>,
  expectedScopes: string[],
  expectedMessage: string,
) {
  expect(res.statusCode).to.equal(403);

  expect(res._getData()).to.equal(expectedMessage);

  const header = res.getHeader('www-authenticate');
  if (typeof header !== 'string') {
    expect.fail(
      `Expected www-authenticate header to be a string, but got ${typeof header}`,
    );
  }

  expect(header.split('scope="')[1]?.split('"')[0]).to.equal(
    expectedScopes.join(' '),
  );

  expect(header.split('error="')[1]?.split('"')[0]).to.equal(expectedMessage);
}

describe('should error', () => {
  it('when expectedScopes is missing', () => {
    expect(jwtAuthz).to.throw(
      Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/,
    );
  });

  it('when expectedScopes is not array', () => {
    const fn = () => {
      // @ts-expect-error - Intentionally passing incorrect type for runtime validation test
      jwtAuthz('test');
    };

    expect(fn).to.throw(
      Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/,
    );
  });
});

describe('should 403 for various authorization errors', () => {
  it('when scope in user does not match expectedScopes', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: '',
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('when scope in user does not match expectedScopes due to leading whitespace', () => {
    const expectedScopes = ['   read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('when scope in user does not match expectedScopes due to trailing whitespace', () => {
    const expectedScopes = ['read:user   '];

    const mockRequest = createRequest({
      auth: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('when scope in user does not match expectedScopes due to case', () => {
    const expectedScopes = ['Read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('by calling the next() callback, when scope is insufficient and `options.failWithError` is `true`', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: '',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { failWithError: true })(
      mockRequest,
      mockResponse,
      (error) => {
        expect(error.statusCode).to.equal(403);
        expect(error.message).to.equal(ERROR_MSG_INSUFFICIENT_SCOPE);
        expect(error.error).to.equal('Forbidden');
        done();
      },
    );
  });

  it('when scope claim does not exist (auth is object, but no scope key)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    );
  });

  it('when using a customScopeKey and scope claim does not exist', () => {
    const expectedScopes = ['read:user'];
    const customScopeKey = 'permissions';
    const mockRequest = createRequest({
      auth: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, { customScopeKey })(
      mockRequest,
      mockResponse,
      mockNext,
    );

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    );
  });

  it('when using a customUserKey and scope claim does not exist', () => {
    const expectedScopes = ['read:user'];
    const customUserKey = 'myUser';
    const mockRequest = createRequest({
      [customUserKey]: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, { customUserKey })(
      mockRequest,
      mockResponse,
      mockNext,
    );

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    );
  });

  it('when using a customUserKey and customScopeKey and scope claim does not exist', () => {
    const expectedScopes = ['read:user'];
    const customUserKey = 'myUser';
    const customScopeKey = 'permissions';
    const mockRequest = createRequest({
      [customUserKey]: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, { customUserKey, customScopeKey })(
      mockRequest,
      mockResponse,
      mockNext,
    );

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    );
  });

  it('when auth.scope is missing some required scopes and options.checkAllScopes is true', () => {
    const expectedScopes = ['read:user', 'write:user', 'delete:user'];

    const mockRequest = createRequest({
      auth: {
        scope: 'read:user write:user',
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, {
      checkAllScopes: true,
    })(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('when auth object does not exist (payload missing)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({});
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      createMissingPayloadMessage('auth'),
    );
  });

  it('when auth.scope is an empty array and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: [],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });

  it('when auth is undefined (payload missing)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: undefined,
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      createMissingPayloadMessage('auth'),
    );
  });

  it('when auth is null (payload invalid)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: null,
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      createMissingPayloadMessage('auth'),
    );
  });

  it('when auth is a string (payload invalid)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: 'read:user',
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      createMissingPayloadMessage('auth'),
    );
  });

  it('when auth is an array (payload invalid)', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: [],
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      createMissingPayloadMessage('auth'),
    );
  });

  it('when scope claim is not a string or array', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: {
        scope: 123, // Invalid scope format
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);
    // Expect scope format error
    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    );
  });

  it('when scope claim is an array with non-string elements', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: {
        scope: ['read:user', 123, 'write:user'], // Malformed scope array
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);
    // Expect malformed array error
    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY,
    );
  });

  it('by calling next() when scope claim format is invalid and failWithError is true', (done) => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: {
        scope: 123, // Invalid scope format
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { failWithError: true })(
      mockRequest,
      mockResponse,
      (error) => {
        expect(error.statusCode).to.equal(403);
        expect(error.message).to.equal(
          ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
        );
        expect(error.error).to.equal('Forbidden');
        done();
      },
    );
  });

  it('by calling next() when scope array is malformed and failWithError is true', (done) => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: {
        scope: ['read:user', 123], // Malformed scope array
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { failWithError: true })(
      mockRequest,
      mockResponse,
      (error) => {
        expect(error.statusCode).to.equal(403);
        expect(error.message).to.equal(ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY);
        expect(error.error).to.equal('Forbidden');
        done();
      },
    );
  });
});

describe('should call next', () => {
  it('when expectedScopes is empty', (done) => {
    const expectedScopes: string[] = [];

    const mockRequest = createRequest();
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when auth.scope is a string and contains the expectedScope', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: 'write:user read:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when auth.scope is an array and contains the expectedScope', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      auth: {
        scope: ['write:user', 'read:user'],
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when auth.scope contains only one of the expectedScopes', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      auth: {
        scope: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when auth.scope has all the expectedScopes and options.checkAllScopes is `true`', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      auth: {
        scope: ['read:user', 'write:user', 'delete:user'],
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { checkAllScopes: true })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customScopeKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      auth: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { customScopeKey: 'permissions' })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customUserKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      myUser: {
        scope: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { customUserKey: 'myUser' })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customUserKey and customScopeKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      myUser: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, {
      customUserKey: 'myUser',
      customScopeKey: 'permissions',
    })(mockRequest, mockResponse, done);
  });

  it('when using a customScopeKey that is an array', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      auth: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, {
      customScopeKey: 'permissions',
    })(mockRequest, mockResponse, done);
  });

  it('should accept keys containing spaces', (done) => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      'user data': {
        'user scope': 'read:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, {
      customUserKey: 'user data',
      customScopeKey: 'user scope',
    })(mockRequest, mockResponse, done);
  });
});

describe('error handling', () => {
  it('should use consistent error structure when failing with error', (done) => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: { scope: '' },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { failWithError: true })(
      mockRequest,
      mockResponse,
      (error) => {
        expect(error).to.have.property('statusCode', 403);
        expect(error).to.have.property('error', 'Forbidden');
        expect(error.message).to.equal(ERROR_MSG_INSUFFICIENT_SCOPE);
        expect(Object.keys(error)).to.have.lengthOf(3);
        done();
      },
    );
  });

  it('should use consistent error structure when responding directly', () => {
    const expectedScopes = ['read:user'];
    const mockRequest = createRequest({
      auth: { scope: '' },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403(
      mockResponse,
      expectedScopes,
      ERROR_MSG_INSUFFICIENT_SCOPE,
    );
  });
});

describe('configuration validation', () => {
  it('should throw when customScopeKey is an empty string', () => {
    expect(() => jwtAuthz(['read:user'], { customScopeKey: '' })).to.throw(
      'customScopeKey must be a non-empty string',
    );
  });

  it('should throw when customScopeKey is only whitespace', () => {
    expect(() => jwtAuthz(['read:user'], { customScopeKey: '   ' })).to.throw(
      'customScopeKey must be a non-empty string',
    );
  });

  it('should throw when customUserKey is an empty string', () => {
    expect(() => jwtAuthz(['read:user'], { customUserKey: '' })).to.throw(
      'customUserKey must be a non-empty string',
    );
  });

  it('should throw when customUserKey is only whitespace', () => {
    expect(() => jwtAuthz(['read:user'], { customUserKey: '   ' })).to.throw(
      'customUserKey must be a non-empty string',
    );
  });
});
