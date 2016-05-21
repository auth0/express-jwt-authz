function error(res){
  return res.send(401, 'Insufficient scope');
}

module.exports = function(expectedScopes) {
  if (!Array.isArray(expectedScopes)){
    throw new Error('Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)');
  }

  return function(req, res, next) {
    if (expectedScopes.length === 0){
      return next();
    }
    if (!req.user || typeof req.user.scope !== 'string') { return error(res); }
    var scopes = req.user.scope.split(' ');
    var allowed = expectedScopes.some(function(scope){
      return scopes.indexOf(scope) !== -1;
    });

    return allowed ?
      next() :
      error(res);
  }
};