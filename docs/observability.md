# Service logging and heartbeat

This service uses native NestJS 11 `ConsoleLogger` JSON output to stdout/stderr, with `Logger` context for application events. No Angular logger or application-held Grafana credential is used. HTTP logs contain generated request ID, method, route template, status and duration; bodies, cookies, authorization headers, concrete identifiers and query strings are not logged by the middleware. Health polling is excluded from access logs. Avoid embedding secrets or personal search text in domain log messages.

## Domain operation events

Maintenance adds `lab_draft_created`, `lab_draft_updated`, `lab_published` and
`challenge_verification` completion events through contextual native Logger calls.
Draft creation includes reusing an existing draft; publication includes idempotent
pointer recovery. These are successful operation outcomes, not new-entity counters.
Reads and individual cases are not logged. A verification summary covers both
authoring/preflight and learner execution, without code, statements, hashes, names,
expected/actual answers, hidden test content or audit identities.

`outcome` is `success`, `failed` (completed verification with nonpassing cases),
`rejected` (HTTP 4xx), or `failure` (5xx/unexpected storage/upstream error).
Success is level `log`; failed/rejected is `warn`; failure is `error`.
Fields are bounded event/outcome, generated operationId (runId for verification),
durationMs, optional requestId, statusCode on errors and suite counts on completion.
Runner startup errors add only `runnerFailure: spawn|container_start` and an
allowlisted exitCode 125/126/127. No raw stderr/exception/configuration is logged.
Nested operations record the same thrown failure once at the innermost boundary;
the separate HTTP status/duration access record is intentionally retained.

HTTP middleware generates a local UUID and runs downstream work in
AsyncLocalStorage. Domain events and the X-Request-ID response/access record share
that ID. Incoming X-Request-ID is ignored, including valid-looking IDs: no untrusted
header is copied into logs and no upstream tracing claim is made. Concurrent
requests have isolated context. Direct non-HTTP operations omit requestId and still
have a generated operation/run ID. Async descendants inherit context; detached
background jobs must establish their own context rather than reuse a completed
request. No job queue or cross-service propagation was added. GET/HEAD health
polls remain quiet.

The installed Nest 11 logger emits event fields under `message`, not at the top
level. A locally captured example shape is:

```json
{
  "level": "log",
  "context": "ChallengeRunnerService",
  "message": {
    "event": "challenge_verification",
    "requestId": "<local-uuid>",
    "runId": "<run-uuid>",
    "outcome": "success",
    "durationMs": 12,
    "totalTests": 2,
    "passedTests": 2
  }
}
```

After selecting the existing service stream in Grafana Explore, a LogQL pipeline
can parse `| json event="message.event", outcome="message.outcome", requestId="message.requestId"`
then filter `| event="challenge_verification" | outcome="failure"`. Keep request,
operation and run IDs as parsed fields, not indexed Loki labels. These queries and
collector receipt still need the infrastructure owner's live acceptance; local
JSON shape tests are not evidence of Grafana ingestion.

`GET /health` and HEAD return the anonymous operational Terminus heartbeat with `status: ok` and `heartbeat: up`, plus `Cache-Control: no-store`. This is liveness only; it does not claim MongoDB or upstream readiness. Existing business-route authentication remains enforced. The gateway's exact read-only heartbeat is the only exception to its normalized proxy-envelope requirement. The operational endpoint is excluded from business Swagger/contracts where that service generates them.

Docker probes `/health` every 30 seconds. Deployments bound each container's local JSON log files to 10 MiB × 3. Host Alloy discovers active service names and ships logs and private HTTP heartbeat probe metrics to Grafana Cloud stack `ivorytoffee195`. Collector configuration/dashboard lives in infrastructure owner `nginx-ngx-workshop.io/ops/grafana`; its ingestion token remains host-owned, scoped to logs/metrics write, and requires account authorization before activation. No production credential belongs in this repository.

Validation on 2026-11-21: the isolated observability HTTP suite passed (5 scenarios), build passed, Linux-targeted lockfile dry run passed. Guarded services additionally passed the anonymous-heartbeat/protected-business-route HTTP test. Gateway production ingress e2e passed (51 scenarios), including exact-path/method heartbeat boundaries. Gateway and publisher lint passed. Full existing unit suites passed except Backstage's unchanged Octokit ESM test-loader failure, reproduced on its pre-change HEAD. Uploader tests pass under its documented `npm test` command; its 10 optional cases remain skipped. Publisher persistence e2e cases require the isolated Mongo URI and remain skipped when unavailable. These are local checks, not evidence of Grafana ingestion or live deployment.
