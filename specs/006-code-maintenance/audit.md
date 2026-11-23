# Code maintenance audit

## T001 baseline — 2026-11-22

HEAD `88ded1e`; Node 24.9.0, npm 11.6.0, installed Nest common 11.1.3,
Prettier 3.6.2. Existing dirty work: AGENTS.md, specs/README.md and untracked
Copilot instructions/prompt/006 specification. Preserve and extend that setup.
The parent entry-point links do not exist; this checkout's AGENTS.md and specs
index are authoritative.

| Command                                                          | Actual baseline                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm test -- --runInBand`                                        | 7 suites, 38 tests pass                                                 |
| `npm run test:e2e -- --runInBand`                                | 7 tests pass; random local Mongo database dropped                       |
| `npm run build`                                                  | Pass, including database-free OpenAPI generation                        |
| `npx --no-install eslint "{src,apps,libs,test}/**/*.ts"`         | 131 errors, 21 warnings, 13 fixable errors                              |
| `npx --no-install prettier --check "src/**/*.ts" "test/**/*.ts"` | Drift in challenge-runner.service.spec.ts and learner-labs.spec.ts only |
| `docker info --format '{{.ServerVersion}}'`                      | Unavailable daemon; real runner/image/container checks blocked          |

## T002 source-backed findings and selection

Dependency flow: AppModule imports global ConfigModule, runtime Mongoose root,
CodingLabsModule and ObservabilityModule. CodingLabsModule registers all three
owned schemas and imports NgxAuthClientModule; it exports nothing. LabsService
uses labs; LabEmbedsService uses embeds/labs/versions; LabVersionsService uses
labs/versions and the single ChallengeRunnerService. The runner uses TypeScript
and Docker spawn, never host execution. Guards use the auth client. Observability
imports Terminus only. No cycles, duplicate providers, forwardRef, service
locators or accidental feature globals were found. Do not split related
collections into artificial modules or create multiple runner capacity counters.

Controllers delegate business/storage decisions; pagination conversion and
published query-ID validation are transport responsibilities. Existing DTOs
validate nested content; schemas retain collection/index policy. Admin guard
assigns audit identity and enforces role; learner guard validates platform auth.
Configuration is environment-driven, including explicit generation-only model
doubles. Do not change auth, route decorators, schema/indexes or public DTOs.

| Priority | Source / finding                                                                               | Decision                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | challenge-runner.service.ts logs raw spawn errors, Docker stderr and environment image/context | Replace with allowlisted structured diagnostics; suite summary includes safe run/request IDs, counts and outcome, not content                                                       |
| P1       | observability.ts generates IDs but does not propagate async context                            | Use small shared AsyncLocalStorage utility; keep locally generated IDs (do not trust incoming headers), test concurrent isolation                                                   |
| P2       | learner-labs.controller.ts defines its auth guard inline                                       | Move guard to dedicated file, retain exact authentication semantics and provider registration                                                                                       |
| P2       | lab-versions.service.ts preflight unnecessarily depends on database-backed lifecycle service   | Extract shared content normalization and a database-free preflight provider; preserve normalization, runner singleton and wire shape                                                |
| P2       | package.json has no hooks/non-mutating checks; deploy.yml has no validation gate               | Pin compatible hooks, self-contained guarded prepare, staged-only formatter and PR/publish checks                                                                                   |
| P2       | inherited lint errors are mostly unsafe values in legacy adapters/test doubles                 | Use ESLint's native explicit suppression baseline for inherited errors after verifying support; retain warnings and reject new errors, document debt, do not disable rules globally |

Async runner capacity is decremented in finally; Docker timers and cleanup are
bounded. Version mutations retain the two-minute Mongo writer lease and finally
release; publish retries repair separate pointer writes. Error translation uses
HTTP exceptions and rethrows unexpected storage errors. Preserve these behaviors.
Add regression for actual pointer-write failure/retry and preflight 429/503 before
moving code. Domain operation logging must rethrow original errors, classify by
status only, and never serialize raw exceptions. Runner failures belong to the
suite event, not another per-case diagnostic. HTTP access logs remain independent.

Constitution: one owned domain, unchanged contracts/access/persistence, meaningful
tests and repository-local evidence; no deviation. No producer/consumer change,
contract release, auth change, database migration or deployment is planned.

## Implementation and verification evidence

Before refactoring, the preflight/publication characterization command
`npm test -- --runInBand lab-preflight.controller.spec.ts lab-versions.service.spec.ts`
passed 13 cases, including new 429/503 propagation and actual failed pointer-write
release/retry. Existing tests characterize auth, invalid input, conflicts,
immutability, cloning and public/learner redaction. The refactor retains these
behaviors; preflight now compiles without any model provider.

The lint baseline was generated from a disposable `git archive HEAD` checkout
using installed ESLint 9.30.0, not from edited source. `--prune-suppressions` then
removed resolved debt. Final baseline: 95 inherited errors (down from 131) and 12
visible warnings (down from 21). New test doubles were typed rather than expanding
suppression counts. A new disposable src/maintenance-negative.ts unused variable
was rejected with exit 1 using the actual config/baseline. Native suppressions
budget counts per file/rule; they are not a substitute for reviewing changed code.

Pinned Husky 9.1.7/lint-staged 16.2.7 were installed with
`npm install --no-audit --no-fund`. Lock changes add their dependency graph and
update shared development CLI dependencies ansi-regex/strip-ansi; no framework,
runtime or auth client upgrade. Local core.hooksPath is `.husky/_`.

| Final command/check                                                                                                                                      | Result / actual boundary                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm test -- --runInBand`                                                                                                                                | 7 suites, 44 tests pass                                                                            |
| `npm run test:e2e -- --runInBand`                                                                                                                        | 7 real HTTP/Mongo tests pass; runner/auth doubled, disposable database dropped                     |
| `npm run build`                                                                                                                                          | Pass, includes database-free OpenAPI generation                                                    |
| `npm run lint:check`                                                                                                                                     | Exit 0, 95 explicitly baselined errors, 12 visible inherited warnings                              |
| `npm run format:check`                                                                                                                                   | Exit 0; all app/test TS and listed tooling files clean                                             |
| `node scripts/test-maintenance-tooling.cjs`                                                                                                              | 4 scenarios pass, none skipped; rerun after final tooling changes                                  |
| Negative lint check in archived fixture                                                                                                                  | Exit 1, new unused variable rejected                                                               |
| `git diff --exit-code -- openapi.json contracts src/collection-interfaces.ts src/coding-labs/dto src/coding-labs/schemas src/coding-labs/admin.guard.ts` | Exit 0, unchanged public contract/storage/admin policy                                             |
| `git diff --check`                                                                                                                                       | Pass                                                                                               |
| Non-formatting dependent source diff review                                                                                                              | Only selected normalization/guard/preflight movement, provider wiring and logging/context wrappers |

Hook fixtures execute actual commits in temporary repositories, never this
checkout: staged formatting, partial staging (staged first-line change vs unstaged
second-line change), unrelated unstaged data, ignored generated contract file,
failed formatting hook preventing a commit, and non-mutating formatting rejection.
They also run actual `npm ci --no-audit --no-fund` for developer/CI/no-Git
package-only installs and `npm ci --no-audit --no-fund --omit=dev` in production,
plus `HUSKY=0` preparation. Temporary install repositories are cleaned.

Logging tests capture native stdout/stderr JSON (`level`, `context`, nested
`message`), suite success/failure, warn-level failed grades, raw-error/content
canary exclusion, one nested error event, UUID correlation and concurrent request
isolation. GET/HEAD health and existing safe access logging remain covered.

Docker daemon/image/real container execution is unavailable; package-only fixture
installation is not a Docker build or runtime claim. No CI run, production
deployment, external auth/gateway or Grafana ingestion was attempted. Those are
explicit external-owner acceptance checks, not failed local unit coverage.
