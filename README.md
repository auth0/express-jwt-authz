# express-jwt-authz ![](https://travis-ci.org/auth0/express-jwt-authz.svg?branch=master)
Validate a JWTs `scope` to authorize access to an endpoint.

## Install

    $ npm install express-jwt-authz

## Usage

Use together with [express-jwt](https://github.com/auth0/express-jwt) to both validate a JWT and make sure it has the correct permissions to call an endpoint.
```javascript
var jwt = require('express-jwt');
var jwtAuthz = require('express-jwt-authz');

app.get('/users',
  jwt({ secret: 'shared_secret' }),
  jwtAuthz([ 'read:users' ]),
  function(req, res) { ... });
```

The JWT must have a `scope` claim and it must be a string that specifies permissions separated by spaces. For example:
```
"write:users read:users"
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.