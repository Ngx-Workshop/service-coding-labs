# Implementation plan

Status: Implemented and locally verified · 2026-09-30
Spec: [spec.md](spec.md)

## Baseline
NestJS 11/Mongoose 8 service; Angular 21 standalone/Material/CodeMirror remote. Preserve hands_on_labs, hands_on_lab_versions, hands_on_lab_embeds and federation exposures. Contract package: @tmdjr/coding-labs-contracts. Existing response schemas lack metadata; execution is absent.

## Sequence and mapping
1. Adapt seed documentation and acceptance (FR-008).
2. Repair lab-versions.service.ts: defaults, reuse active draft, in-place compare-and-swap saves, immutable publication, server content hashes (FR-001/002).
3. Add bounded Docker runner, DTOs, verify endpoint and enforced publish check (FR-003/004/005). Transpile TypeScript without evaluation, separate container per case, compare outside container. No unsafe fallback.
4. Admin guard, ID/filter validation, local CORS, redacted published-content route (FR-006). Development auth requires explicit flags, non-production mode and loopback binding.
5. Generate OpenAPI and local contract snapshot without npm publishing (FR-007).
6. Repair remote routing, JSON/create/save; add verification results, publish feedback and unsaved protection (FR-003/004/007).
7. Unit/HTTP tests, real Mongo/Docker lifecycle, browser checks and evidence (FR-008).

## Constitution
Retain domain ownership and API service separation. No other collections. Backend admin enforcement. Preserve Angular standalone/signals/Material and exports. Maintain local docs and meaningful tests. No production deployment.

## Compatibility
Existing drafts readable; only current draft edits/publishes. Updated editor always sends expected content hash. Published legacy versions immutable. Unsupported legacy tests need conversion. Allocate version numbers with atomic lab counter initialized from historical maximum. Add verify/learner routes; retain existing paths. Authentication supplies audit actor.

## External owners and delivery
service-auth owns token validation/admin roles. Host/gateway owns /coding-labs-editor and /api/coding-labs. Document/learner repos consume version-pinned redacted content. Deploy service before MFE. Local verification uses dedicated Mongo database and Docker.

## Verification
AC-001/004/005: HTTP tests and Mongo integration. AC-002/006: frontend tests and browser. AC-003: comparator tests plus real container pass/fail/error/timeout. AC-007: both builds and contract generation. Hosted session may require user sign-in; record separately.

## References
- https://docs.docker.com/reference/cli/docker/container/run — container constraints.
- https://nodejs.org/api/vm.html — vm is not a security mechanism.
