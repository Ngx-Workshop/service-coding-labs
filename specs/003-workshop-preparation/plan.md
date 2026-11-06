# Implementation plan

Status: Implemented; production acceptance pending
Spec: [spec.md](spec.md)
Updated: 2026-11-05

## Design
Keep server checks authoritative. Package application skills under gateway src/publishing/skills and copy them into compiled assets. Add private asynchronous preparation start/get tools with timestamped activity, normalized draft hash, and bounded repair. Use the existing Responses structured format and owning-service HTTP APIs. Add an admin-only coding-lab preflight endpoint reusing the isolated runner without DB writes. UI API validates published schemas; store orchestrates polling; scoped VM owns report and approval; stateless presenter shows activity.

## Constitution check
Respect service ownership, admin auth, isolated execution, generated source contracts, Angular MVVM, inline OnPush/BEM views and existing federation/recovery. No credentials in activity. No database access across services.

## Compatibility and delivery
Additive contracts: coding-labs preflight first, gateway second, publisher third. Existing generation/validation tools remain compatible; new UI uses preparation tools and passes its preparation ID to publication. A report is bound to normalized draft and identity. No automatic publication retry. Jobs are bounded process-local data, expire after one hour once finished, and are unavailable after restart.

## Verification
Exercise success/failure, unavailable runner, starter discrimination, identity and stale hash with doubles. Regenerate producer OpenAPI/contracts and install a reproducible local gateway contract tarball in publisher. Run repo tests/builds, gateway protocol checks, UI architecture/strict tests, and responsive browser verification. Never execute model code on gateway or browser.

## Final compatibility and recovery
New tools accept an optional caller preparationId; same subject/input returns the current report, changed input conflicts. The UI keeps this ID before starting, permitting polling after a lost response. Preparation is process-local; publication evidence becomes durable only with its publishing receipt. The new UI must be deployed after gateway and lab-preflight. Legacy generation strips learningPlan for older strict clients; legacy publication keeps its existing behavior. No stored document/assessment migration. The final read-back is a journaled check, not a cross-service transaction or rollback.
