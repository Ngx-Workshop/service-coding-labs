# Development

| Environment | Purpose |
| --- | --- |
| MONGODB_URI | Runtime database; local script uses coding_labs_local |
| PORT / HOST | Default 3009 / 0.0.0.0; local script explicitly binds loopback:3009 |
| AUTH_BASE_URL | Token validation service, default https://auth.ngx-workshop.io |
| CORS_ORIGINS | Defaults http://localhost:4201,https://admin.ngx-workshop.io |
| CODING_LABS_LOCAL_DEV | Explicit non-production, loopback-only admin mode; browser Origin checked |
| RUNNER_IMAGE | Prepared execution image, default node:22-alpine |
| RUNNER_DOCKER_CONTEXT | Optional context, e.g. desktop-linux |
| DOCKER_HOST / DOCKER_TLS_VERIFY / DOCKER_CERT_PATH | Standard execution-daemon connection settings |
| GENERATE_OPENAPI | Generation only; main refuses to listen in this mode |

Do not commit .env/credentials. The inherited .env may specify PORT=3008; start:local overrides that and the database. The tested local runner image resolved to sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402.

## Checks

README lists commands. E2E creates a random coding_labs_test_* database on local Mongo, substitutes auth-token validation and runner results, and drops only that database. It exercises actual guards, DTO validation, controllers and storage. Smoke uses real Docker and leaves its lab records archived. Unit tests need no infrastructure.

Pre-pull the image; requests use --pull=never. Unavailable runner/image returns 503; two already-active verification suites return 429. Limits: 50 tests; 100–10000 ms/case; 64–512 MB/container; 60 seconds/suite; 64 KB output. Nest's default body-size limit applies.

## Contracts

Build dynamically imports AppModule after enabling generation mode, skipping Mongo. Generation stubs cannot serve live traffic. Generate OpenAPI and models from source; never manually edit generated output. Copy openapi.json to the remote and run its contracts:generate script. The remote's checked-in snapshot avoids requiring sibling source or an unpublished package.

The source contract package version predates published 0.0.3. No version is published by this task; a release owner must assign a fresh version.

## Compatibility and limitations

PATCH and publish require expectedContentHash. Authoring now requires admin identity. Legacy timeout/memory limits and unit/custom cases may require changes before publication. Existing published content remains readable. Historical duplicate version numbers need auditing before adding a unique index.

Publishing spans two Mongo writes; retry publish with the same version/hash to repair a failed pointer update. Already-completed publication is idempotent. Production auth/gateway/runner deployment remains a separate check. Dependency audits report findings; broad dependency upgrades are outside this change. Actual evidence is in the feature handoff.
