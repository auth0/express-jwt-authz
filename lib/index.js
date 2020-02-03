module.exports = (expectedScopes, options) => {
  if (!Array.isArray(expectedScopes)) {
    throw new Error(
      'Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)'
    );
  }

  return (req, res, next) => {
    const error = res => {
      const err_message = 'Insufficient scope';

      if (options && options.failWithError) {
        return next({
          statusCode: 403,
          error: 'Forbidden',
          message: err_message
        });
      }

      res.append(
        'WWW-Authenticate',
        `Bearer scope="${expectedScopes.join(' ')}", error="${err_message}"`
      );
      res.status(403).send(err_message);
    };
    if (expectedScopes.length === 0) {
      return next();
    }

    let userScopes = [];
    let scopeKey = 'scope';
    if (
      options &&
      options.customScopeKey != null &&
      typeof options.customScopeKey === 'string'
    ) {
      scopeKey = options.customScopeKey;
    }
    let userKey = 'user';
    if (
      options &&
      options.customUserKey != null &&
      typeof options.customUserKey === 'string'
    ) {
      userKey = options.customUserKey;
    }


    if (!req[userKey]) {
      return error(res);
    }
    if (typeof req[userKey][scopeKey] === 'string') {
      userScopes = req[userKey][scopeKey].split(' ');
    } else if (Array.isArray(req[userKey][scopeKey])) {
      userScopes = req[userKey][scopeKey];
    } else {
      return error(res);
    }

    let allowed;
    if (options && options.checkAllScopes) {
      allowed = expectedScopes.every(scope => userScopes.includes(scope));
    } else {
      allowed = expectedScopes.some(scope => userScopes.includes(scope));
    }

    return allowed ? next() : error(res);
  };
};
