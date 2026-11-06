# Feature: Workshop preparation skills and checks

Status: Implemented; production acceptance pending
Created: 2026-11-05
Request: Implement workshop authoring skills, checks, and visible skill/check progress.

## Problem and scope
Administrators need evidence of how workshop drafts were authored and checked before resources become visible. Preserve editor serialization, domain ownership, administrator boundaries, and publication recovery.

## Functional requirements
- FR-001: Load versioned planning, documentation, coding-lab and assessment skills into generation and report their actual application.
- FR-002: Check structure, editor serialization, runner compatibility, assessment consistency and objective coverage. Execute reference and starter code through the coding-lab owner's isolated runner without persistence.
- FR-003: Show pending/running/passed/failed/skipped/review-required outcomes with evidence and timing. Separate machine checks from model judgments and human review.
- FR-004: Permit one bounded content repair, retain findings, bind checked content to its hash, and invalidate approval after edits.
- FR-005: Keep preparation jobs private to their administrator, bound capacity/retention, and never publish during preparation.

## Acceptance scenarios
- AC-001: Generating a workshop records exact skill versions and check outcomes; polling reveals real progress.
- AC-002: Invalid tests, mismatched objectives, a failing reference or already-solved starter prevents readiness; unavailable execution never passes.
- AC-003: Imported or edited content gets fresh checks; stale preparation cannot authorize changed content.
- AC-004: Foreign administrators cannot read jobs; timeouts do not create owner records or replay publication.
- AC-005: UI preserves input and displays failures, explicit human review, and accessible responsive activity.

## Boundaries and success criteria
Local behavior tests, generated contracts, strict builds and UI verification establish implementation. Paid provider calls, production deployment and live owner acceptance are separate. No persisted workshop migration.

## Final implementation decisions
Client-provided preparation IDs are bound to identity and parsed input for idempotent starts in the current gateway process. Version/fingerprint means instructions were supplied, not proof the model followed them. Imports/check-only runs do not call the model. Identical expected outputs require review instead of blindly rejecting a legitimate constant-output task. The new publisher enforces preparation; legacy direct publication remains compatible and does not claim new preflight success. Facts, actual rendered layouts and diagram parsing remain explicitly human-reviewed. Prepared publication verifies saved navigation references after owner writes.
