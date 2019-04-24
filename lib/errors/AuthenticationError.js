module.exports = function AuthenticationError(message, statusCode, error) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;

  this.statusCode = statusCode || 403;
  this.error = error || 'Forbidden';
};

require('util').inherits(module.exports, Error);
