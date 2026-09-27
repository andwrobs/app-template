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
| [MAINT-01](maintenance-and-distribution.md#maint-01-source-drift-intake) | Monthly upstream and dependency report | P2 / M | none |
| [MAINT-02](maintenance-and-distribution.md#maint-02-remaining-dependencies-and-utilities) | Review remaining dependencies and utilities | P2 / S | none |
| [MAINT-03](maintenance-and-distribution.md#maint-03-optional-agent-profiles) | Optional Codex/Claude role profiles | P3 / S | none |
| [DIST-03](maintenance-and-distribution.md#dist-03-publish-the-repository) | Push the repository and first tag | P2 / S | owner go-ahead |
| [API-01](maintenance-and-distribution.md#api-01-optional-generated-api-boundary) | Optional OpenAPI client recipe | P3 / M | API-02 |
| [APP-01](app-and-agents.md#app-01-page-titles) | Page titles | P1 / S | none |
| [APP-02](app-and-agents.md#app-02-styled-not-found-and-error-pages) | Styled not-found and error pages | P1 / S | none |
| [APP-03](app-and-agents.md#app-03-route-change-focus) | Route change focus and skip link | P1 / S | none |
| [APP-04](app-and-agents.md#app-04-optional-sidebar-app-shell) | Optional sidebar app shell | P2 / M | none |
| [APP-05](app-and-agents.md#app-05-validated-environment) | Validated environment | P2 / S | none |
| [API-02](app-and-agents.md#api-02-a-small-api-client) | Small API client | P2 / S | APP-05 |
| [AGENT-01](app-and-agents.md#agent-01-a-new-route-skill-for-apps) | "New route" skill for apps | P1 / S | APP-01 |
