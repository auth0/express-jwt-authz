function error(res){
  return res.status(401).send('Insufficient scope');
};

exports.checkScopes = function(expectedScopes, requestKey = 'user', comparison = 'ALL') {
  if (!Array.isArray(expectedScopes)){
    throw new Error('Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)');
  }

  return function(req, res, next) {
    if (expectedScopes.length === 0){
      return next();
    }

    if (!req[requestKey] || typeof req[requestKey].scope !== 'string') { return error(res); }
    
    var scopes = req[requestKey].scope.split(' ');

    var allowed = (comparison = 'ANY') ? 
        expectedScopes.some(function(scope){
          return scopes.indexOf(scope) !== -1;
        }) :
        // ALL is default option
        expectedScopes.every(function(scope){
          return scopes.indexOf(scope) !== -1;
        });

    return allowed ?
      next() :
      error(res);
  }
};