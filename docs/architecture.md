# Architecture — service-coding-labs

## Ownership and source map

NestJS 11/Mongoose 8 owns challenge authoring and published delivery. Workshops, learner submissions, scoring and identity remain external.

| Source | Responsibility |
| --- | --- |
| src/coding-labs/labs.service.ts | Catalog, workshop/slug uniqueness, metadata, archive |
| src/coding-labs/lab-versions.service.ts | Current draft, hashes, writer lock, publication and redaction |
| src/coding-labs/challenge-content.ts | Validation, comparators, example and hash |
| src/coding-labs/challenge-runner.service.ts | TypeScript transpilation and Docker execution |
| src/coding-labs/admin.guard.ts | Token validation, admin role and audit identity |
| src/coding-labs/lab-embeds.service.ts | Published lab/document block references |
| src/coding-labs/dto and schemas | Validation/Swagger and persistence |
| src/swagger.ts, openapi.json, contracts/coding-labs | Database-free contract generation |

Collections retain hands_on_labs, hands_on_lab_versions and hands_on_lab_embeds. No destructive migration.

## Lifecycle

Create metadata, then create/reuse its current draft. New labs receive a sum-array template; subsequent drafts clone the latest publication. PATCH changes the draft in place and requires expectedContentHash. Stale writes return 409. Published content is immutable.

A per-lab Mongo lock serializes draft/verify/publish across instances; its two-minute recovery lease exceeds the 60-second verification budget. Archive refuses an active lease. Version allocation incorporates historical maximums. Publish checks the caller's hash and reruns all saved tests. Browser flags cannot assert success.

Publication and the lab pointer are separate Mongo writes, supporting standalone Mongo. If a pointer write fails, retrying publish with the same hash re-verifies and repairs that pointer. This is not a multi-document transaction.

## Test contract

Define a function such as solve(input). Each case passes exactly one JSON argument; use an object for multiple parameters. Return finite JSON, including null. Async results are awaited. TypeScript is transpiled, not project-type-checked. Packages, imports, DOM and Angular component harnesses are unsupported.

Comparators: deepEqual (structural, array order matters); strictEqual (primitives without coercion); numberTolerance (absolute nonnegative tolerance); stringNormalized (optional whitespace/case normalization).

Publication requires statement, starter, reference, unique test names, at least one sample and hidden test, and at most 50 total cases. Legacy unit/custom cases remain readable but need conversion before execution.

## HTTP boundary

Admin-only: /labs CRUD; /labs/:labId/versions, /draft and /:versionId; POST /:versionId/verify and /publish; /embeds CRUD. Verify and publish return 200. Creation returns 201, archive/delete 204. Invalid IDs return 400; missing entities 404; stale/busy writes 409.

Public: GET /published-labs/:labId?versionId=... returns allowlisted published content. It excludes hiddenTests, referenceSolution, audit identities and internal locks. Draft/archived labs are unavailable. This task does not add learner submissions.

Default authoring access validates platform credentials and role=admin via @tmdjr/ngx-auth-client. The gateway forwards accessToken cookies or Bearer tokens. Audit actors are server-assigned. Embed creation requires a published lab in the same workshop and, if pinned, a published version of that lab.

## Execution boundary

Every case uses a fresh non-root container with no network, host mounts or credentials, read-only root, dropped capabilities, no-new-privileges and CPU/PID/memory/output limits. Expected answers remain outside. node:vm is only a function harness inside the container, never a security boundary. There is no host-process fallback.

The API needs a Docker CLI and execution daemon. Dockerfile includes the CLI, not a daemon/socket. Production must configure an isolated execution host through Docker connection settings, prepare/pin RUNNER_IMAGE, and review capacity. This admin-only reference verifier is not a hardened public multi-tenant judge.

References: [Docker controls](https://docs.docker.com/reference/cli/docker/container/run), [Node vm](https://nodejs.org/api/vm.html).
