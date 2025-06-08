# Changelog

# 3.0.0

> **Migration Guide:** For detailed upgrade instructions from `v2` to `v3`, see [MIGRATION.md](MIGRATION.md).

### BREAKING CHANGES

- **Export Method:** The library now uses a named export (`export const jwtAuthz`) instead of `module.exports`. CommonJS consumers must update their `require` statements from `const jwtAuthz = require('express-jwt-authz');` to `const { jwtAuthz } = require('express-jwt-authz');`. ES Module imports (`import { jwtAuthz } from ...`) remain unchanged.
- **Default User Key:** The default value for the `customUserKey` option has been changed from `'user'` to `'auth'`. This aligns with `express-jwt` `v6.0.0` and later. If you are using an older version of `express-jwt` or a different middleware that places the user payload on `req.user`, you must now explicitly pass `{ customUserKey: 'user' }` to `jwtAuthz`. Users of modern `express-jwt` no longer need to specify `{ customUserKey: 'auth' }`.
- **Node.js Version Requirement:** Minimum Node.js version has been updated from `>=6` to `>=14`. Node.js versions 6, 8, 10, and 12 have all reached end-of-life and are no longer supported. This change allows the library to leverage modern JavaScript features and aligns with current Node.js LTS versions.

### Added

- Migrated entire codebase from JavaScript to TypeScript, providing first-class type definitions included in the package.
- Added official peer dependency support for Express `^5.0.0`.
- Introduced comprehensive unit tests with improved coverage reporting using `c8`.
- Added test coverage reporting mechanism.
- Validate JWT scope arrays to ensure all elements are strings, returning a specific error message (`ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY`) if not.
- Export error message constants (`ERROR_MSG_INSUFFICIENT_SCOPE`, `ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT`, `ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY`) and a helper function (`createMissingPayloadMessage`) to allow consumers (especially tests) to identify specific authorization failures.
- Added tests for invalid scope claim types and malformed scope arrays.

### Changed

- Updated various development dependencies.
- Implemented TypeScript compilation using `tsc`.
- Updated README with TypeScript examples, type information, setup instructions, and contribution guidelines.
- Improved specificity of error messages for different failure scenarios (invalid payload object, invalid scope claim format, insufficient scope).
- Updated test suite to use exported error constants/helper and assert correct error messages.
- Updated README examples for clarity.

### Fixed

- Middleware now correctly returns a 403 error instead of potentially succeeding or throwing unexpected errors when the scope claim is present but not a string/array or contains non-string elements.

### Removed

- Removed old JavaScript source files.
- Redundant and incorrect `describe('scope validation')` test suite.

# 2.4.1

- Fixed TS export to model CommonJS

# 2.4.0

- Added support for a custom user key (`customUserKey`)
- Added TypeScript definitions

# 2.3.0

- Added support for a custom scope key (`customScopeKey`)

# 2.2.0

- Added support for array scopes
- Added option `checkAllScopes` to check that all the required scopes are allowed

# 2.1.1

- Add `WWW-Authenticate` header when authentication fails

# 2.1.0

- Added option `failWithError` to call next() when scope is insufficient

# 2.0.0

- Fix express deprecation of `res.send`
- Added `express@^4.0.0` as a peer dependency

# 1.0.0

- Initial Commit
