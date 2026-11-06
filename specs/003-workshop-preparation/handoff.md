# Handoff: Workshop preparation skills and checks

Status: Implemented; production acceptance pending
Updated: 2026-11-05
Spec: [spec.md](spec.md)
Plan: [plan.md](plan.md)
Tasks: [tasks.md](tasks.md)

## Delivered behavior

Implemented admin-only POST /lab-preflight with PreflightLabDto and generated contracts. LabVersionsService normalizes unsaved authoring content and delegates to the existing constrained ChallengeRunnerService. No model reads/writes or persisted lab lock. Existing IO-only, one-input, comparator, suite, time/memory and Docker isolation policies apply. Response documents invalid content, admin access, busy execution and unavailable runner outcomes.

## Verification evidence

- PASS: 33 tests across 6 suites. New real Nest HTTP tests exercise guard/DTO/route behavior with auth and runner doubles; persistence access throws.
- PASS: Nest build/OpenAPI generation and owner contract generation/build.
- PASS: real Docker dry-run reference 2/2, unfinished starter 0/2, constant baseline 1/2. No lab/version records were created.
- PASS: gateway-to-actual-local-Nest-owner HTTP preparation with Docker execution yielded ready=true. Auth double, no database connection and no production API use.
- No package publication or deployment. Existing source contract version predates registry releases; release owner must assign an available owner version if publishing it.

## Delivery and remaining acceptance

1. Release service-coding-labs with POST /lab-preflight and available isolated runner image.
2. Release service-mcp-gateway with copied skill assets and preparation tools. Its application contract is generated as 1.3.0; no npm release is implied. Keep the existing private publication volume and single-instance profile.
3. Release mfe-user-journey-admin-ai-publisher with its committed 1.3.0 contract tarball. Check authenticated shell generation, report polling, content review and publication receipt against real owners/provider.

No document/assessment schema change. Retain human review for facts, diagram rendering/source and instructional quality. No automatic visual-rendering pass or arbitrary mutation-testing claim. Preparation is bounded process-local state (two active, one per subject, 100 retained, one-hour finished TTL, capacity eviction/restart loss). Publication evidence remains durable. Legacy publication without preparationId is compatible and follows its prior owner verification path.

Context docs: architecture/development and gateway workshop-publishing guide describe exact boundaries. All local implementation tasks are complete; X001 is production rollout/acceptance.

## Authorized release follow-up

The live admin proxy returned 404 Cannot POST /lab-preflight while the new publisher
was already using preparation. The endpoint was still uncommitted in this checkout.
The user's supplied draft was verified unchanged in the real isolated runner:
reference 7/7, starter 0/7, constant baseline 1/7. Local owner verification passes
33 tests, build, OpenAPI and contract generation/build. The user explicitly authorized
committing/pushing this preflight feature to main, including automatic contract
publication and production deployment. Live route and wizard acceptance follow CI.
