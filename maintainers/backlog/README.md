# Backlog

Candidate starter work. Priorities are advisory; [status](../status.md) holds the
chosen order and active work. Use `template-task` to pick up and retire items.

Priority: P1 next, P2 after, P3 later. Size: S short, M one session, L split at
pickup. Check shorthands:

- `baseline`: `npm ci` then `npm test`.
- `rendered`: desktop, mobile, keyboard and focus, and the relevant states.
- `fresh-clone`: an app made by the README copy step (or its replacement) outside this
  folder, with no inherited node_modules, build output, or cache.

| Key | Outcome | Priority / size | Depends on |
| --- | --- | --- | --- |
| [DEMO-04](ui-and-examples.md#demo-04-query-mutations-and-route-integration) | Query mutation and invalidation example | P2 / M | none |
| [QUALITY-01](maintenance-and-distribution.md#quality-01-browser-and-static-host-proof) | Browser, accessibility, and deep-link checks in CI | P1 / M | none |
| [MAINT-01](maintenance-and-distribution.md#maint-01-source-drift-intake) | Registry and skill drift report | P2 / M | none |
| [MAINT-02](maintenance-and-distribution.md#maint-02-remaining-dependencies-and-utilities) | Review remaining dependencies and utilities | P2 / S | none |
| [MAINT-03](maintenance-and-distribution.md#maint-03-optional-agent-profiles) | Optional Codex/Claude role profiles | P3 / S | none |
| [DIST-03](maintenance-and-distribution.md#dist-03-publish-the-repository) | Push the repository and first tag | P2 / S | owner go-ahead |
| [API-01](maintenance-and-distribution.md#api-01-optional-generated-api-boundary) | Optional OpenAPI client recipe | P3 / M | none |
