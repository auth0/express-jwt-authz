import * as express from 'express';

export = jwtAuthz;

declare function jwtAuthz(
  expectedScopes: jwtAuthz.AuthzScopes,
  options?: jwtAuthz.AuthzOptions
): express.Handler;

declare namespace jwtAuthz {
  export type AuthzScopes = string[];

  export interface AuthzOptions {
    failWithError?: boolean;
    customScopeKey?: string;
    customUserKey?: string;
    checkAllScopes?: boolean;
  }
}
