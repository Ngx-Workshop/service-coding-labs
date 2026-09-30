# Feature: LeetCode-style challenge authoring

Status: Implemented and locally verified · Created: 2026-09-30

## Problem and audience
Workshop administrators need to author, prove, and publish executable coding challenges. The inherited implementation cannot create its first draft, creates a new version on every save, rejects primitive JSON tests, and never executes a solution.

## Requirements
- FR-001: Create/catalog/filter/archive workshop-scoped labs with difficulty, tags and estimated time. Preserve identities and workshop links.
- FR-002: Maintain one active editable draft, save without generating revisions, clone the latest publication for the next version, and prevent published mutation. Reject stale concurrent saves.
- FR-003: Author Markdown statements, hints, JavaScript/TypeScript starter/reference code, and named sample/hidden input-output tests. Any JSON value including null is valid. Each test invokes entryFnName(input); use an object for multiple arguments.
- FR-004: Verify reference code against all tests with per-case passed/failed/error/timeout results. Support structural equality, primitive strict equality, nonnegative decimal number tolerance and explicit string normalization. Reject unsupported unit/custom execution explicitly.
- FR-005: Publishing reruns the saved reference successfully against at least one sample and one hidden test. Require statement, starter, reference and valid entry function. Never trust browser verification flags.
- FR-006: Authoring requires platform admin authentication. Explicit local development authentication is loopback-only. Learner delivery includes only published prompts, starter, hints and sample tests; never solutions/hidden cases.
- FR-007: Preserve federation exports and nested host routes. Development API uses localhost:3009; production uses gateway prefix.
- FR-008: Maintain adapted seed workflow, architecture, development, spec, plan, tasks and handoff locally.

## Acceptance
- AC-001: Create, open draft, save twice and reload; content persists with stable draft ID/version.
- AC-002: Accept 0, false, strings, arrays, objects and null; block malformed JSON without silently saving stale values.
- AC-003: Correct reference passes; wrong output shows expected/actual; syntax errors and infinite loops give bounded diagnostics.
- AC-004: Incomplete/failing drafts cannot publish. Passing drafts publish; published PATCH is rejected; next draft copies publication.
- AC-005: Learner JSON omits secrets. Anonymous/non-admin access fails. Invalid IDs return 400; missing entities 404.
- AC-006: Catalog/create/editor/overview work under /coding-labs-editor and standalone with recoverable errors.
- AC-007: Builds, behavior tests, generated contracts and local API/browser checks record real evidence.

## Boundaries and assumptions
First release: JSON function challenges in JavaScript/TypeScript, including async function results. No dependency installation, Angular component harness, other languages, learner submission history, grading/leaderboards or production deployment. Existing unit/custom definitions remain readable but cannot be verified/published by this runner. Existing collections preserved; no destructive migration. Document editor and learner journey remain external owners.

## Execution quality
Execute in short-lived containers: no network, host mounts or credentials; non-root, dropped capabilities, read-only filesystem, bounded memory/CPU/PIDs/output/wall time. Never execute submitted code inside the API process or treat node:vm as a security boundary. Admin-only execution is not a public multi-tenant judge.
