# Maintenance and distribution

## QUALITY-01 Browser and static-host proof

P1 · M · Build. Depends on: none.

**Outcome:** one command, locally and in CI, proves the built SPA works on a static host.

**Acceptance:** pinned Playwright Chromium at desktop and mobile sizes covers direct
refresh of each example route, dark and reduced-motion emulation on
`/examples/components`, back and forward, Aria navigation without a reload,
populated, empty, and error states with recovery, a missing route, network failure,
and keyboard focus. axe runs on key states. Screenshots and traces are saved on
failure. `build/client` is served with an explicit SPA fallback that still returns 404
for missing assets and API paths, not by an SSR server. The CI browser download is
documented, and test output stays out of apps.

**Checks:** fresh-clone baseline plus the browser command. Look at the screenshots.

## MAINT-01 Source drift intake

P2 · M · Build. Depends on: none.

**Outcome:** a read-only report of upstream changes to the copied Aria source and the
Router skill, which dependency PRs miss.

**Acceptance:** compares inventory hashes with fresh upstream copies, records version
and date, and tells a fetch failure apart from no change. Never overwrites local
files. Scheduled in GitHub only once the repository exists, with notification
behavior chosen explicitly.

**Checks:** unchanged, changed, and unavailable cases, plus one real report.

## MAINT-02 Remaining dependencies and utilities

P2 · S · Build. Depends on: none.

**Outcome:** the remaining direct dependencies are reviewed on purpose, with no
open-ended ranges or speculative utilities.

**Acceptance:**
- Run deps:check and read release and engine notes. Match `@types/node` to the
  runtime, review React 19.3 and newer build and test packages, and update related
  groups with evidence.
- List the utilities present and the ones worth adding. Audit advisories by runtime,
  dev, and transitive exposure; as of 2026-09-27, `npm audit` reports a moderate Vitest
  advisory (dev only). Decide on shadcn's `cn` package, which registry items now import
  ([inventory](../ui-inventory.md)).
- `test-utils/zustand-store-mock.ts` documents a selector its signature doesn't
  support. Fix it with a real consumer and test, or delete it.
- `lefthook.yml` is never installed. Document opt-in setup or remove it. Never change
  users' Git hooks automatically.

**Checks:** clean `npm ci` and `npm test`, plus tests for changed behavior.

## MAINT-03 Optional agent profiles

P3 · S · Build. Depends on: none.

**Outcome:** if repeated tasks justify it, frontend-builder and read-only reviewer
profiles shared by Codex and Claude.

**Acceptance:** config formats checked against official docs. One profile source, with
a deterministic command that generates and checks the adapters, and no drift. No Java
or persistence roles, pinned models, or parallel delegation by default. AGENTS.md and
the skills still work without the profiles.

**Checks:** config validation, the drift check, and one bounded invocation if possible.

## DIST-03 Publish the repository

P2 · S · Build. Depends on: the owner's go-ahead.

**Outcome:** the starter lives in the private GitHub repository chosen in
[decision 0002](../decisions/0002-distribution.md), with the `v0.1.0` tag, and CI and
Dependabot run there.

**Acceptance:** the remote exists and is private, `main` and the tag are pushed, the
Verify workflow passes on Node 22 and 24, and Dependabot opens its first grouped PRs.
Optionally mark it a template repository. Publishing the CLI to npm is a separate
decision.

**Checks:** a clone from the remote, `node bin/create-react-spa.mjs` into a temp
folder, and `npm test` there.

## API-01 Optional generated API boundary

P3 · M · Build. Depends on: none.

**Outcome:** an optional OpenAPI transport recipe for apps that have a backend.

**Acceptance:** a pinned generator, a local schema fixture or explicit endpoint,
generated code in a named capability, a handwritten typed transport with error
handling, and reproducible regeneration. No hardcoded `localhost:8000` Spring URL,
Filebonsai DTOs, auth, or backend assumptions.

**Checks:** reproducible generation, typecheck, and decoding a sample response and error.
