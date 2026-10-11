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

### Troubleshooting runner startup

The runner uses Docker from the service process environment. An open SSH terminal
does not configure a remote daemon. For a locally running service, start Docker
Desktop and check `docker info`, `docker image inspect node:22-alpine`, and
`docker run --rm --pull=never node:22-alpine node --version`. If using
`RUNNER_DOCKER_CONTEXT`, use that same `--context` for every check and image pull.
Restart the service after changing its environment.

Runner startup failures log the image, context, exit code and up to 2,000
characters of Docker stderr; missing-CLI failures log the spawn error. HTTP 503
responses retain the generic message. Solution code and test inputs are not
included in these diagnostic messages.

On 2026-10-06, both local Docker sockets were unavailable. Starting Docker Desktop
restored the default connection; the existing node:22-alpine image ran with the
runner's isolation flags. A direct ChallengeRunnerService verification passed
both sample and hidden sum-array tests, and all 26 unit tests passed, including
startup diagnostics for exits 125/126/127 and a missing CLI. This check did not
modify or verify the user's saved draft through the browser.

### Production runner repair — 2026-10-06 (America/New_York)

The production host had Docker 28.1.1, but the API container had no socket mount
and the host lacked node:22-alpine. With explicit approval for same-server daemon
access, the image was pulled and only coding-labs was recreated from its inspected
configuration with /var/run/docker.sock mounted. The original container is stopped
as coding-labs-before-runner-20261007T032354Z; its private configuration snapshot
is /root/coding-labs-before-runner-20261007T032354Z/inspect.json on the server.
The existing image, environment, ports and restart policy were preserved.

Docker access from the replacement succeeded. Direct verification using the
deployed ChallengeRunnerService passed both sum-array sample/hidden cases in
701 ms. GET /labs returned the expected unauthenticated 401. The user's saved
draft was not modified or verified through the authenticated browser flow.

The local deployment workflow now pulls the default runner image before downtime
and mounts the socket; Compose has the same mount and its configuration validates.
These repository changes must be committed and deployed to retain the fix on
future releases. A custom RUNNER_IMAGE must also be prepared on its daemon.

## Contracts

Build dynamically imports AppModule after enabling generation mode, skipping Mongo. Generation stubs cannot serve live traffic. Generate OpenAPI and models from source; never manually edit generated output. Copy openapi.json to the remote and run its contracts:generate script. The remote's checked-in snapshot avoids requiring sibling source or an unpublished package.

The source contract package version predates published 0.0.3. No version is published by this task; a release owner must assign a fresh version.

## Compatibility and limitations

PATCH and publish require expectedContentHash. Authoring now requires admin identity. Legacy timeout/memory limits and unit/custom cases may require changes before publication. Existing published content remains readable. Historical duplicate version numbers need auditing before adding a unique index.

Publishing spans two Mongo writes; retry publish with the same version/hash to repair a failed pointer update. Already-completed publication is idempotent. Production auth/gateway/runner deployment remains a separate check. Dependency audits report findings; broad dependency upgrades are outside this change. Actual evidence is in the feature handoff.

## Learner journey — 2026-10-11

Additive public catalog and authenticated grading routes are in specs/002-learner-journey. User metadata forwards the current platform identity to POST /published-labs/:labId/grade. Published content and saved tests remain service-owned. Existing admin-only CRUD is unchanged. The isolated runner is reused, with no host/browser fallback. Build/OpenAPI and both contract generation/build commands regenerate additive producer types; assign a fresh contract version before publishing.
