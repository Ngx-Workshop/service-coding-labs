# Plan

Baseline HEAD: `115e5fcad8ce49f6b72061ef37358f6688217b88`. Audit found jobs publish, deploy;
deploy prerequisites were `publish`.
Use the central Node CLI policy and reviewed service-specific job profile. Separate
validation from publication, make deploy need validate only, preserve transport
steps and existing contract/version semantics. Main-only guards protect mutation;
OIDC write permission belongs only to manual publish. Preserve domain/access rules;
no application/schema changes. Verify YAML parsing, event gates, source transport
comparison and CLI drift check. No live deployment verification is requested.
