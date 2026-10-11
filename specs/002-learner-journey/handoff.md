# Handoff: learner coding lab journey

Status: Implemented; authenticated beta integration pending
Updated: 2026-10-11 (America/New_York)
Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Tasks: [tasks.md](tasks.md)

## Delivered behavior

Replaced seed CRUD with the learner coding catalog, searchable published cards, theme-matched hero/navigation, CodeMirror workspace, sanitized challenge instructions, sample cases and hints, saved-code revisions, server submission, persisted results, history and retry. Existing App/Routes/federation identity and hello-world mount are preserved. Earlier results remain intact; retries use current publication or resume an existing active attempt. Archived content does not block historical result/solution viewing.

Coding service adds allowlisted GET /published-labs and authenticated POST /published-labs/:labId/grade, reusing the constrained Docker runner. Hidden test details, reference code and hashes never enter learner responses. Existing admin authoring endpoints stay restricted.

Metadata adds owned GET/POST /user-metadata/coding-lab-attempts and GET/PATCH :id plus POST :id/submit. Server identity determines ownership, unknown body properties are rejected, request IDs are idempotent, active attempts are unique, saves use optimistic revisions, submissions use tokenized leases, and only upstream server grades can complete an attempt. Failed execution keeps code and releases its lease. New collection/indexes are additive.

## Verification evidence

| Check | Result and scope |
| --- | --- |
| Frontend architecture and strict/no-unused type check | PASS |
| Frontend ChromeHeadless tests | PASS, 13 tests: catalog/search/loading/empty/error, history, conflict retention, duplicate commands, chained saves/submission, runner retry, browser query drafts |
| Frontend production federation build | PASS, isolated dist/learner-verification output |
| Coding service unit tests | PASS, 30 tests |
| Coding service HTTP e2e | PASS, 7 tests, real disposable Mongo; auth/runner doubles |
| Metadata unit tests | PASS, 50 tests |
| Metadata HTTP e2e | PASS, 5 tests, real disposable Mongo; auth/upstream doubles |
| Both Nest builds and OpenAPI generation | PASS |
| Both producer contract generation/builds | PASS; generated snapshots match producer files byte-for-byte |
| Cross-service local HTTP integration | PASS, real Mongo and Docker; test identity. Catalog/redaction, ownership, idempotency, stale save, forged-score rejection, passing/failing grades, history and retry verified |
| Local browser | PASS: start, edit/save, reload keeps code, submit passes, fresh retry preserves previous history; desktop and 390px mobile inspected; no horizontal page overflow; Tab exits editor to next control |
| Authenticated beta | NOT VERIFIED: supplied URL redirected this browser to sign-in |
| Whitespace diff check | PASS across all three repositories |

The initially inherited frontend test targeted seed CRUD; replaced with learner tests. An empty-state dirty calculation initially prompted during refresh; corrected and covered. The metadata inherited Hello World e2e targeted a nonexistent root route and lacked teardown; replaced with real attempt API coverage. Final suites pass.

## Contract and release handoff

1. Release additive service-coding-labs catalog/grading endpoints, keeping Docker runner configured. Existing authoring clients remain compatible.
2. Release service-user-metadata and set CODING_LABS_BASE_URL to the coding service base URL (without /published-labs). Ensure coding_lab_attempts indexes exist before concurrent starts. Forward normal platform Cookie/Authorization credentials.
3. Verify gateway /api/coding-labs/* and /api/user-metadata/* forwarding, then release the learner remote. Confirm the signed-in beta flow at /coding-labs/hello-world.
4. Assign fresh versions and publish both generated contract packages. Frontend and metadata currently use generated producer snapshots because published packages predate these additions; replace snapshots with published imports after release.

No packages were published, no services deployed, no production configuration changed, and no commits created. Existing frontend package/lockfile/federation modifications were preserved; the obsolete seed contract dependency was removed. Test databases use unique local names and were dropped on harness cleanup.

## Remaining work

T005: authenticated beta verification and release/configuration above. Local source behavior is implemented and verified; production auth/gateway/capacity and package release remain external integration work. Frontend context docs, adoption status, testing guide, producer architecture/development docs and metadata coding journey documentation now describe this flow.
