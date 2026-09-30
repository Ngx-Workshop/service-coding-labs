# Handoff — challenge authoring

Status: Implemented and locally verified · 2026-09-30

[Spec](spec.md) · [Plan](plan.md) · [Tasks](tasks.md)

## Delivered

JavaScript/TypeScript challenge authoring with Markdown statement/preview, starter/reference code, hints, sample/hidden JSON tests, comparators, per-case verification and backend-enforced publication. Drafts save in place with optimistic concurrency; publications are immutable, and subsequent drafts clone published content. The server enforces admin access, authoritative actors, ID/filter validation and published-only embed references. Public learner content explicitly omits hidden tests and solutions.

Both repositories include adapted seed AGENTS.md, constitution/workflow/templates, architecture/development guidance and this feature's spec/plan/tasks/handoff. Generated OpenAPI and local model snapshots are included; no npm release was published.

## Verification evidence

| Check | Result | Boundary |
| --- | --- | --- |
| Service npm test -- --runInBand | PASS, 22 tests | Comparator/JSON validation, hash, publish gates/recovery, admin guard |
| Service npm run test:e2e -- --runInBand | PASS, 6 tests | Real disposable local Mongo and HTTP; auth validation and execution mocked |
| Service npm run test:smoke | PASS | Real local API/Mongo/Docker: repeated saves, stale conflict, correct/wrong output, blocked publication, synchronous/async timeout, runtime/syntax errors, primitives/null, publication, immutability, redaction, embed ownership, next version and archive |
| MFE npm test -- --watch=false --browsers=ChromeHeadless | PASS, 14 tests | JSON/CVA preservation, disabled publishing controls, credentialed API/hash requests and app rendering |
| Service build and generated contract build | PASS | OpenAPI bootstraps without database |
| MFE production and development builds | PASS | Final production build has no Angular warnings; development rebuilt last for local preview |
| Hosted shell browser | PASS | Created demo, entered TypeScript solution, verified 2/2 cases, blocked malformed JSON save, published v1, displayed embed/history, opened cloned v2, rendered Markdown preview and verified again |
| git diff --check | PASS in both repositories | No whitespace errors |

The hosted browser used https://admin.ngx-workshop.io with the local remote on port 4201 and API on loopback:3009. Service local mode used coding_labs_local; no production database or deployment was changed. API smoke records were archived. A demonstration lab remains: 6abca5763b2ecd0f16ae87fa, title “Sum an array — demo challenge”; v1 published and v2 available for editing.

## Contract handoff and rollout

- Deploy the service before the new MFE. Authoring requires validated admin credentials; the gateway forwards the accessToken cookie or Bearer header.
- PATCH draft and publish now require expectedContentHash. Verification/publish POST returns HTTP 200. New verification response includes per-case status, expected/actual, message and duration.
- GET /published-labs/:labId?versionId=... is the public, redacted learner contract. Workshop documents use labId and optional pinnedVersionId. No learner submissions/attempt tracking were added.
- Old unit/custom test definitions and unsupported runner limits remain readable but require conversion before republishing. Existing collections and publications are preserved.
- Prepare a Docker execution image and isolated daemon/connection for production. Dockerfile supplies a CLI only. The reference runner is admin-only, not a public multi-tenant judge.
- The MFE's local generated types come from its checked-in openapi.json. Copy a new service artifact and run contracts:generate for future contract updates. No sibling source is a build dependency.

## Operations and remaining scope

Local functionality is complete for JSON function challenges. Production deployment, production token/gateway validation, learner submission UI, Angular component tests and other languages are outside this implementation. Publication spans two Mongo writes; retrying the same version/hash repairs a failed pointer update. Dependencies still have npm audit findings (service: 55; MFE: 73 at install time); dependency remediation was not attempted as part of the feature.

The API was left running on 127.0.0.1:3009 against coding_labs_local, with Docker Desktop context desktop-linux. The user's existing MFE static server on 4201 was retained. For subsequent development use the documented start:local and dev:bundle commands. Do not run a clean production build concurrently with a Nest watch process sharing dist.

Browser note: one historical shell view-transition “viewport size changed” error was observed before final reload; final authoring operations succeeded. No new editor errors were observed during the final flow.
