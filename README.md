# Coding Labs service

Ngx-Workshop's coding challenge authoring API: workshop-scoped labs, editable drafts, immutable published versions, reference-solution verification and embed references. Supports JavaScript and TypeScript functions with JSON input/output.

Start with [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md), [development](docs/development.md), and the [authoring specification](specs/001-challenge-authoring/spec.md).

## Local use

Requires Node 22+, npm, MongoDB on 127.0.0.1:27017, and a running Docker engine.

1. Run npm ci.
2. Prepare the execution image: docker pull node:22-alpine.
3. Run npm run start:local. This binds to 127.0.0.1:3009 and uses coding_labs_local.
4. Configure the admin MFE development API as http://localhost:3009.
5. Run npm run test:smoke for real API/Mongo/container verification.

On Docker Desktop, set RUNNER_DOCKER_CONTEXT=desktop-linux if needed. The local script overrides inherited PORT/MONGODB_URI values. It grants local admin access only in non-production mode on loopback; never use that mode for deployment.

## Verification

- npm test -- --runInBand — unit behavior.
- npm run test:e2e -- --runInBand — HTTP contract with disposable local Mongo and mocked auth/runner.
- npm run test:smoke — real Docker tests; its records are archived afterward.
- npm run build — build and database-free OpenAPI generation.
- npm run contracts:coding-labs:gen && npm run contracts:coding-labs:build — generated contracts.

These commands do not publish packages or deploy.
