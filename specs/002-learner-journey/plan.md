# Implementation plan

Coding service owns catalog/content/grading. User metadata owns authenticated attempt persistence and calls the coding service over configured HTTP, forwarding platform authentication only. Frontend stateless clients → singleton store → scoped view model → OnPush presentation components. Preserve federation and hello-world route.

Additive endpoints and collection, no destructive migration. Generate OpenAPI/contracts from DTOs and use a checked-in generated snapshot until published packages contain these additions. Reference and hidden code stay server-side. Reuse Docker isolation and bounded concurrency. Use optimistic revisions and a submission lease to prevent overlapping writes; server results alone decide success.

Verify type checks, architecture, frontend/service tests, builds, generated contracts, and browser loading/success/history/retry with local services when available. Record integration limitations separately.

Published packages do not yet contain the additive contracts. Generated producer snapshots are a temporary compatibility exception to the published-type preference, not handwritten contracts. Regenerate from producer OpenAPI and replace with published imports after release. Existing endpoints/exports remain compatible. Tests substitute auth identities only in the test harness.
