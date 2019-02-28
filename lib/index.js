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
    if (!req.user || typeof req.user.scope !== 'string') {
      return error(res);
    }
    const scopes = req.user.scope.split(' ');
    const allowed = expectedScopes.some(scope => scopes.includes(scope));

    return allowed ? next() : error(res);
  };
};
