const error = res => res.status(403).send('Insufficient scope');

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
    if (!req.user || (typeof req.user.scope !== 'string' && !Array.isArray(req.user.scope))) {
      return error(res);
    }

    var scopes = [];
    if (typeof req.user.scope === 'string') {
      scopes = req.user.scope.split(' ');
    }
    else if (Array.isArray(req.user.scope)) {
      scopes = req.user.scope;
    }
    const allowed = expectedScopes.some(scope => scopes.includes(scope));

    return allowed ? next() : error(res);
  };
};
