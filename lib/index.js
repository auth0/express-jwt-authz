
function error(res){
  return res.status(401).send('Insufficient scope');
};

module.exports = function(expectedScopes, requestObjectKey = 'user', compareAny = true) {

  if (!Array.isArray(expectedScopes)){
    throw new Error('Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)');
  }

  if(requestObjectKey === null || 
    !(typeof requestObjectKey === 'string' || 
      (typeof requestObjectKey === "object" && requestObjectKey.constructor === String))){
    throw new Error('Parameter requestObjectKey must be a string value');
  }
  
  if(compareAny === null || (typeof compareAny !== 'boolean')){
    throw new Error('Parameter copmareAny must be a boolean value');
  }

  return function(req, res, next) {
    if (expectedScopes.length === 0){
      return next();
    }

    if (!req[requestObjectKey] || typeof req[requestObjectKey].scope !== 'string') { return error(res); }
    
    var userScopes = req[requestObjectKey].scope.split(' ');

    var allowed = (!compareAny) ? 
        expectedScopes.every(function(scope){
          return userScopes.indexOf(scope) !== -1;
        }) :
        // ANY is default compareAny option
        expectedScopes.some(function(scope){
          return userScopes.indexOf(scope) !== -1;
        });

    return allowed ?
      next() :
      error(res);
  }
};