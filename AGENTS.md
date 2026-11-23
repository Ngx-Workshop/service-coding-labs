# Agent entry point — service-coding-labs

This repository owns coding challenge authoring, verification, versions, and embed references for Ngx-Workshop. Assume you have
access to this repository only. Frontends, gateway, auth service, and other data
services are external owners; do not require their source to begin local work.

## Read before implementation

1. [Constitution](.specify/memory/constitution.md): durable design rules.
2. [Architecture](docs/architecture.md): responsibilities, source map, external contracts.
3. [Development](docs/development.md): commands, verification, known limitations.
4. [Workflow](.specify/README.md): specify → plan → tasks → implement → verify.
5. The relevant feature folder listed in [specs](specs/README.md), if one exists.

For a newly cloned product repository, also follow [seed adoption](docs/seed-adoption.md).
All links above resolve within this checkout. Do not assume a sibling repository exists.

## Working rules

- Inspect relevant source and `git status` before editing; preserve unrelated changes.
- Maintain a local spec, plan, tasks, and handoff for features and behavior changes.
  Small docs edits and mechanical fixes can use a concise change/verification summary.
- Enforce administrator access for authoring. Execute reference code only in the isolated container runner.
- Keep controllers, DTO validation, service logic, and persistence responsibilities
  clear. Do not access another service's collections to bypass its API.
- Regenerate OpenAPI and local contracts for API changes; document consumer impact.
  Do not hand-edit generated artifacts as the source of a contract change.
- Use the explicit OpenAPI generation environment described in the development
  guide. Generation stubs are not runtime authentication or database behavior.
- Resolve routine choices and record assumptions. Ask only for missing decisions
  that materially affect requirements or compatibility; continue independent work.
- Verify changed behavior and record actual results, pre-existing failures, and
  unavailable infrastructure separately. Do not report empty suites as coverage.
- Update affected context docs and leave a handoff for external contract consumers.

This is a Markdown workflow inspired by Spec Kit. It does not install Spec Kit,
register slash commands, or require a particular AI tool.

## Selected task: Code Maintenance

The selected work is [Code Maintenance](specs/006-code-maintenance/spec.md) (Implemented locally; live integration pending).
Read its [plan](specs/006-code-maintenance/plan.md), [tasks](specs/006-code-maintenance/tasks.md) and
[handoff](specs/006-code-maintenance/handoff.md). Local T001–T010 evidence is recorded; retain older unfinished
feature records without treating them as the next task. The requested work covers
NestJS module/domain boundaries, thin controllers, cohesive services, Prettier
with Husky/lint-staged, CI checks and safe domain logging through existing
observability. Continue from the handoff's external acceptance checks; do not
repeat the setup audit as unimplemented runtime work.

Current deployment policy: [deployment-workflows](docs/deployment-workflows.md). Automatic main delivery verifies/deploys; npm publication is manual only. This supersedes older automatic-publishing instructions.
