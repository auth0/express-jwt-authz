# Migration Guide: v2 to v3

This guide helps you migrate from `express-jwt-authz` v2 to v3. Version `3.0.0` includes several breaking changes that may require updates to your code.

## Breaking Changes Overview

1. **Export method changed.** The package now uses named exports instead of default export.
2. **Default `customUserKey` changed** from `'user'` to `'auth'`.
3. **Minimum Node.js version** updated from Node.js `v6+` to Node.js `v14+`.

## 1. Update Import/Require Statements

The library now uses named exports instead of CommonJS default exports.

### CommonJS (`require`)

**Before (v2):**

```javascript
const jwtAuthz = require('express-jwt-authz');
```

**After (v3):**

```javascript
const { jwtAuthz } = require('express-jwt-authz');
```

### ES Modules (`import`)

**Before (v2):**

```javascript
import jwtAuthz from 'express-jwt-authz';
```

**After (v3):**

```javascript
import { jwtAuthz } from 'express-jwt-authz';
```

## 2. Adjust Configuration Based on Your `express-jwt` Version

This package adds a property to the Express `req` object that holds the JWT payload data. The `customUserKey` option defines the name of that property. The default name for the `customUserKey` option has changed from `'user'` (for `req.user`) to `'auth'` (for `req.auth`) to align with the naming conventions of `express-jwt v6.0.0+`, which is a JWT validation library often used in combination with this one.

### If you're using `express-jwt` `v5` or older

**Before (v2):**

```javascript
// With express-jwt v5, the payload is on req.user.
const checkJwt = jwt({ secret: 'your-secret' });

// express-jwt-authz v2 also defaults to req.user, so no extra config was needed.
const checkScopes = jwtAuthz(['read:users']);

app.use(checkJwt, checkScopes);
```

**After (v3):**

```javascript
// With express-jwt v5, the payload is on req.user.
const checkJwt = jwt({ secret: 'your-secret' });

// express-jwt-authz v3 defaults to req.auth, so you must explicitly point it to 'user'.
const checkScopes = jwtAuthz(['read:users'], { customUserKey: 'user' });

app.use(checkJwt, checkScopes);
```

### If you're using `express-jwt` `v6` or newer

**Before (v2):**

```javascript
// With express-jwt v6+, the payload is on req.auth.
const checkJwt = expressjwt({ secret: 'your-secret' });

// v2 defaulted to 'user', so config was required to point it to 'auth'.
const checkScopes = jwtAuthz(['read:users'], { customUserKey: 'auth' });

app.use(checkJwt, checkScopes);
```

**After (v3):**

```javascript
// With express-jwt v6+, the payload is on req.auth.
const checkJwt = expressjwt({ secret: 'your-secret' });

// v3 also defaults to 'auth', so no extra config is needed.
const checkScopes = jwtAuthz(['read:users']);

app.use(checkJwt, checkScopes);
```

## 3. Update Node.js Version

Ensure your Node.js version is `v14` or higher:

```bash
node --version
# Should output v14.0.0 or higher
```

If you're using an older version, update Node.js before upgrading to `v3`.

## Complete Migration Example

Here's a full example showing all changes needed:

### Before (v2 with express-jwt v5):

```javascript
const express = require('express');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');

const app = express();

// express-jwt v5 puts payload on req.user
const checkJwt = jwt({
  secret: 'your-secret',
  algorithms: ['HS256'],
});

// v2 default customUserKey was 'user'
const checkScopes = jwtAuthz(['read:messages']);

app.get('/messages', checkJwt, checkScopes, (req, res) => {
  res.json({ messages: ['Hello World'] });
});
```

### After (v3 with express-jwt v5):

```javascript
const express = require('express');
const jwt = require('express-jwt');
const { jwtAuthz } = require('express-jwt-authz'); // Note: destructured import

const app = express();

const checkJwt = jwt({
  secret: 'your-secret',
  algorithms: ['HS256'],
});

// Must explicitly set customUserKey for express-jwt v5
const checkScopes = jwtAuthz(['read:messages'], { customUserKey: 'user' });

app.get('/messages', checkJwt, checkScopes, (req, res) => {
  res.json({ messages: ['Hello World'] });
});
```

### Before (v2 with express-jwt v6+):

```javascript
const express = require('express');
const { expressjwt } = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');

const app = express();

// express-jwt v6+ puts payload on req.auth by default
const checkJwt = expressjwt({
  secret: 'your-secret',
  algorithms: ['HS256'],
});

// v2 defaulted to 'user', so needed explicit configuration for express-jwt v6+
const checkScopes = jwtAuthz(['read:messages'], { customUserKey: 'auth' });

app.get('/messages', checkJwt, checkScopes, (req, res) => {
  res.json({ messages: ['Hello World'] });
});
```

### After (v3 with express-jwt v6+):

```javascript
const express = require('express');
const { expressjwt } = require('express-jwt');
const { jwtAuthz } = require('express-jwt-authz'); // Note: destructured import

const app = express();

// express-jwt v6+ puts payload on req.auth by default
const checkJwt = expressjwt({
  secret: 'your-secret',
  algorithms: ['HS256'],
});

// No customUserKey needed - default 'auth' matches express-jwt v6+
const checkScopes = jwtAuthz(['read:messages']);

app.get('/messages', checkJwt, checkScopes, (req, res) => {
  res.json({ messages: ['Hello World'] });
});
```

## TypeScript Users

If you're using TypeScript, the type imports have also changed:

**Before (v2):**

```typescript
import jwtAuthz from 'express-jwt-authz';
// Types were not included in v2
```

**After (v3):**

```typescript
import {
  jwtAuthz,
  AuthzOptions,
  AuthzScopes,
  AuthzError,
} from 'express-jwt-authz';
// TypeScript types are now included!
```

## New Features in v3

While migrating, you can take advantage of new v3 features:

- **Built-in TypeScript support** - No need for `@types/express-jwt-authz`
- **Better error messages** - More specific error messages for different failure scenarios
- **Exported error constants** - Use in tests or error handling:
  ```javascript
  import {
    ERROR_MSG_INSUFFICIENT_SCOPE,
    ERROR_MSG_SCOPE_CLAIM_MISSING_OR_INVALID_FORMAT,
    ERROR_MSG_SCOPE_CLAIM_MALFORMED_ARRAY,
    createMissingPayloadMessage,
  } from 'express-jwt-authz';
  ```

## Troubleshooting

### Error: "Cannot find module 'express-jwt-authz'"

Make sure you're using the destructured import: `const { jwtAuthz } = require('express-jwt-authz')`

### Error: "req[auth] is missing or not an object"

You're likely using express-jwt v5 or older. Add `{ customUserKey: 'user' }` to your jwtAuthz options.

### Error: "The engine "node" is incompatible"

Update to Node.js 14 or higher.

## Need Help?

If you encounter issues not covered in this guide, please:

1. Check the [README](README.md) for updated examples
2. Review the [CHANGELOG](Changelog.md) for additional details
3. Open an issue on [GitHub](https://github.com/auth0/express-jwt-authz/issues)
