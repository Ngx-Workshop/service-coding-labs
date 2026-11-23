# Development

| Environment                                        | Purpose                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| MONGODB_URI                                        | Runtime database; local script uses coding_labs_local                     |
| PORT / HOST                                        | Default 3009 / 0.0.0.0; local script explicitly binds loopback:3009       |
| AUTH_BASE_URL                                      | Token validation service, default https://auth.ngx-workshop.io            |
| CORS_ORIGINS                                       | Defaults http://localhost:4201,https://admin.ngx-workshop.io              |
| CODING_LABS_LOCAL_DEV                              | Explicit non-production, loopback-only admin mode; browser Origin checked |
| RUNNER_IMAGE                                       | Prepared execution image, default node:22-alpine                          |
| RUNNER_DOCKER_CONTEXT                              | Optional context, e.g. desktop-linux                                      |
| DOCKER_HOST / DOCKER_TLS_VERIFY / DOCKER_CERT_PATH | Standard execution-daemon connection settings                             |
| GENERATE_OPENAPI                                   | Generation only; main refuses to listen in this mode                      |

Do not commit .env/credentials. The inherited .env may specify PORT=3008; start:local overrides that and the database. The tested local runner image resolved to sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402.

## Checks

README lists commands. E2E creates a random coding*labs_test*\* database on local Mongo, substitutes auth-token validation and runner results, and drops only that database. It exercises actual guards, DTO validation, controllers and storage. Smoke uses real Docker and leaves its lab records archived. Unit tests need no infrastructure.

Pre-pull the image; requests use --pull=never. Unavailable runner/image returns 503; two already-active verification suites return 429. Limits: 50 tests; 100–10000 ms/case; 64–512 MB/container; 60 seconds/suite; 64 KB output. Nest's default body-size limit applies.

### Troubleshooting runner startup

The runner uses Docker from the service process environment. An open SSH terminal
does not configure a remote daemon. For a locally running service, start Docker
Desktop and check `docker info`, `docker image inspect node:22-alpine`, and
`docker run --rm --pull=never node:22-alpine node --version`. If using
`RUNNER_DOCKER_CONTEXT`, use that same `--context` for every check and image pull.
Restart the service after changing its environment.

Runner startup failures now log a structured suite failure with `statusCode: 503`,
`runnerFailure: container_start` and exit code 125/126/127, or `runnerFailure: spawn`
for spawn failures. Raw stderr, spawn errors and environment image/context values
are deliberately excluded because they can contain credentials or private content.
Inspect Docker availability/image configuration directly when diagnosing a failure.
HTTP 503 responses retain their existing generic messages.

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

## Preflight checks — 2026-11-05

New controller tests exercise real Nest routing, DTO validation and admin guard with
an auth double; any model access fails the test. Runner execution is doubled there.
A separate real Docker preflight verified a reference (2/2), unfinished starter (0/2)
and constant-answer baseline (1/2), without database writes. No live production API
or authenticated-shell acceptance is implied. Rebuild OpenAPI and both contract
outputs; deploy this additive endpoint before gateway preparation is enabled. The
existing contract source version predates registry releases; no owner package is
published by this task. The gateway uses the documented wire shape and its validated
version model alongside the existing published create-version type boundary.

## Deployment storage policy

See [deployment cleanup](deployment-cleanup.md) for success-only image/container retention and local verification.

## Service observability

See [logging and heartbeat](observability.md) for operational endpoint semantics, JSON logging, collector ownership and actual validation.

## Maintenance checks and hooks

- `npm ci` enables Husky locally when Git and devDependencies are present.
  Preparation skips CI, `HUSKY=0`, production, omitted devDependencies and no-Git
  installs. The lifecycle is self-contained in package.json, so Docker's
  package-manifest-only installation order remains valid.
- Pre-commit runs the locally installed lint-staged/Prettier, with no tool download.
  Only staged supported TS/JS/JSON/Markdown/YAML files are formatted. Default
  lint-staged stash/hide/restore preserves partial staging and unstaged changes.
  Generated contracts/OpenAPI/lockfile/suppression baseline and build/coverage
  output are excluded by .prettierignore; there are no vendored source assets.
- `npm run format:check` is non-mutating and checks all application/test TypeScript
  plus the maintained tooling configuration/script. Historical documentation and
  unrelated deployment scripts are not silently pulled into a new formatting gate.
  Staging supported documentation still formats that staged document.
- `npm run lint:check` is non-mutating. eslint-suppressions.json was generated
  using ESLint 9.30.0's native `--suppress-all` on untouched HEAD `88ded1e`, then
  pruned as affected code was improved. It records inherited errors, not new ones;
  rules remain enabled. Suppression counts are per file/rule, not exact lines.
  Review changed code even when a file stays within its existing debt budget.
  Do not regenerate with `--suppress-all` to hide new errors. When reducing debt,
  run `npm run lint:check -- --prune-suppressions` and review the baseline change.
  Unsuppressed legacy warnings remain visible.
- `node scripts/test-maintenance-tooling.cjs` uses disposable Git/install fixtures:
  clean developer/CI/no-Git package-only/production installs, formatting, partial
  staging, ignored generated files, hook rejection and non-mutating negative
  formatting checks. It creates commits only in temporary fixtures and cleans them.
- The PR/main validation workflow runs checks, unit tests, tooling fixtures and
  build. Publishing additionally runs lint/format/unit gates before its existing
  generation/release steps. Mongo e2e still requires its local disposable database;
  Docker execution and live Grafana acceptance are separate infrastructure checks.

Deployment and npm publication now follow [deployment-workflows](deployment-workflows.md).
