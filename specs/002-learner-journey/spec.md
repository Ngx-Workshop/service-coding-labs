# Learner coding lab journey

Audience: authenticated workshop learners. Authoring remains in the admin remote.

- FR-001: discover only published, unarchived labs; read redacted immutable versions.
- FR-002: start/resume an owned attempt, save code and submit to the isolated server runner.
- FR-003: persist server-scored results in user metadata; preserve prior attempts on retry.
- FR-004: match assessment theme, hero, cards, navigation, history, responsive and accessible states.

Acceptance: AC-001 published catalog excludes drafts and secrets. AC-002 saves survive reload and concurrent edits conflict. AC-003 hidden expectations never reach learners. AC-004 retry creates a fresh attempt after completion without changing history. AC-005 failed saves/execution retain code and allow retry. AC-006 other users cannot read or update attempts.

Assumptions: retries use the latest published version; resumed attempts retain their version. No browser execution or fabricated success. Deployment and package publication require a separate release.
