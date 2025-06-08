import type { Handler, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      [key: string]: unknown;
    }
  }
}

/**
 * Array of scope strings required for authorization.
 * Each string represents a permission that can be granted to a user.
 *
 * @example
 * ```typescript
 * const scopes: AuthzScopes = ['read:users', 'write:users'];
 * ```
 */
export type AuthzScopes = string[];

/**
 * Configuration options for the JWT authorization middleware.
 */
export type AuthzOptions = {
  /**
   * If true, authorization failures will be passed to Express's error handler
   * via next(error) instead of sending a 403 response directly.
   * @default false
   */
  failWithError?: boolean;

  /**
   * Custom key to look for scopes in the JWT payload.
   * Use this if your JWT uses a different property name for scopes.
   * @default 'scope'
   */
  customScopeKey?: string;

  /**
   * Custom key to look for the JWT payload on the request object.
   * Use this if your JWT middleware uses a different property name.
   * @default 'auth'
   */
  customUserKey?: string;

  /**
   * If true, requires all specified scopes to be present in the JWT.
   * If false, only one of the specified scopes needs to be present.
   * @default false
   */
  checkAllScopes?: boolean;
};

/**
 * Standard error structure for authorization failures.
 */
export type AuthzError = {
  /** HTTP status code (always 403 for authorization errors) */
  statusCode: 403;
  /** Error type identifier */
  error: 'Forbidden';
  /** Human-readable error message */
  message: string;
};

export const ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT =
  'Scope claim missing or has invalid format.';
export const ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY =
  'Malformed scope claim: all scopes in the array must be strings.';
export const ERROR_MSG_INSUFFICIENT_SCOPE = 'Insufficient scope.';

/**
 * Creates the error message for when the expected JWT payload object is missing or invalid.
 * @param authKey The key on the request object where the payload was expected.
 * @returns The formatted error message string.
 */
export const createMissingPayloadMessage = (authKey: string): string => {
  return `req[${authKey}] is missing or not an object.`;
};

/**
 * Default property name for scopes in the JWT payload.
 * @constant
 */
const DEFAULT_SCOPE_KEY = 'scope';

/**
 * Default property name for the JWT payload on the request object.
 * Matches express-jwt v6.0.0+ default.
 * @constant
 */
const DEFAULT_AUTH_KEY = 'auth';

/**
 * Checks if a value is a plain object (has properties) and not null or an array.
 * @param value The value to check.
 * @returns True if the value is likely a plain object, false otherwise.
 */
function isObjectWithProperties(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  if (value === null) {
    return false;
  }

  if (typeof value !== 'object') {
    return false;
  }

  return !Array.isArray(value);
}

/**
 * Creates and returns an Express middleware function that verifies a user's JWT scope
 * claim against a set of expected scopes.
 *
 * Note: Scope comparison is case-sensitive.
 *
 * @param expectedScopes An array of scope strings required for access.
 * @param options Configuration options for the middleware's behavior.
 * @returns An Express middleware function (express.Handler).
 */
export const jwtAuthz = (
  expectedScopes: AuthzScopes,
  options?: AuthzOptions,
): Handler => {
  if (!Array.isArray(expectedScopes)) {
    throw new Error(
      'Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)',
    );
  }

  if (options?.customScopeKey !== undefined && !options.customScopeKey.trim()) {
    throw new Error('customScopeKey must be a non-empty string');
  }

  if (options?.customUserKey !== undefined && !options.customUserKey.trim()) {
    throw new Error('customUserKey must be a non-empty string');
  }

  return (req, res, next) => {
    const error = (res: Response, message: string) => {
      const authError: AuthzError = {
        statusCode: 403,
        error: 'Forbidden',
        message: message,
      };

      if (options && options.failWithError) {
        return next(authError);
      }

      res.append(
        'WWW-Authenticate',
        `Bearer scope="${expectedScopes.join(' ')}", error="${authError.message}"`,
      );
      res.status(authError.statusCode).send(authError.message);
    };

    if (expectedScopes.length === 0) {
      return next();
    }

    let scopeKey = DEFAULT_SCOPE_KEY;
    let authKey = DEFAULT_AUTH_KEY;
    let userScopes: string[] = [];

    if (
      options &&
      options.customScopeKey != null &&
      typeof options.customScopeKey === 'string'
    ) {
      scopeKey = options.customScopeKey;
    }

    if (
      options &&
      options.customUserKey != null &&
      typeof options.customUserKey === 'string'
    ) {
      authKey = options.customUserKey;
    }

    const payload = req[authKey];

    if (!isObjectWithProperties(payload)) {
      return error(res, createMissingPayloadMessage(authKey));
    }

    const scopes = payload[scopeKey];

    const hasScopesAsString = typeof scopes === 'string';
    const hasScopesAsArray = Array.isArray(scopes);

    if (!(hasScopesAsString || hasScopesAsArray)) {
      return error(res, ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT);
    }

    if (hasScopesAsString) {
      userScopes = scopes.split(' ');
    }

    if (hasScopesAsArray) {
      const allElementsAreStrings = scopes.every(
        (scope) => typeof scope === 'string',
      );

      if (!allElementsAreStrings) {
        return error(res, ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY);
      }
      userScopes = scopes as string[];
    }

    let allowed =
      options && options.checkAllScopes
        ? expectedScopes.every((scope) => userScopes.includes(scope))
        : expectedScopes.some((scope) => userScopes.includes(scope));

    return allowed ? next() : error(res, ERROR_MSG_INSUFFICIENT_SCOPE);
  };
};
