declare module "express-jwt-authz" {
  import { Response, Request, NextFunction } from "express";
  import { RequestHandler } from "express-serve-static-core";
  /**
   * @summary Validates a JWTs scope to authorize access to an endpoint
   * @description Use together with express-jwt to both validate a JWT
   * and make sure it has the correct permissions to call an endpoint.
   * ```js
   * const jwt = require('express-jwt');
   * const jwtAuthz = require('express-jwt-authz');
   *
   * app.get('/users',
   *  jwt({ secret: 'shared_secret' }),
   *  jwtAuthz([ 'read:users' ]),
   *  function(req, res) { ... });
   * ```
   * @param {string[]} expectedScopes list of the scope claims
   */
  function expressJwtAuthz(
    expectedScopes: string[]
  ): (req: Request, res: Response, next: NextFunction) => RequestHandler;

  export = expressJwtAuthz;
}
