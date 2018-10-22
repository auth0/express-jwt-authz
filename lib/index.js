const error = res => res.status(401).send('Insufficient scope');

module.exports = expectedScopes => {
  if (!Array.isArray(expectedScopes)) {
    throw new Error(
      'Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)'
    );
  }

  return (req, res, next) => {
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
