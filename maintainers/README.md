# Maintaining the starter

This folder and the `template-task` and `template-maintenance` skills cover the
starter itself. Apps don't get them.

Root `AGENTS.md` applies here too. Starter work adds:

- [Decision 0001](decisions/0001-starter-contract.md) sets scope. No backend or
  product-specific API. Examples stay removable, with synthetic fixtures and no
  credentials or external services.
- [Status](status.md) is the only record of verified state, active work, and next steps.
- The [backlog](backlog/README.md) holds candidate work. Pick it up with `template-task`.
- [Maintenance](maintenance.md) covers refreshes and releases. Use
  `template-maintenance`.
- [Decision 0002](decisions/0002-distribution.md) covers the repository, license,
  releases, and `bin/create-react-spa.mjs`. The [changelog](CHANGELOG.md) lists
  releases.
- The [UI inventory](ui-inventory.md) records where `src/lib/ui` came from.
- The [intake audit](audit-2026-09-26.md) is a dated record. Don't update it.

## Keep apps clean

Files that apps receive never mention this folder, the `template-*` skills, status,
or backlog keys. `bin/` and the README's "Create an app" section are starter-only; the
CLI leaves them out. Before finishing, this must print nothing (the CLI's tests run the
same check on a generated app):

```bash
grep -rnE 'maintainers/|template-(task|maintenance)|status\.md|backlog|Filebonsai|(UI|DEMO|QUALITY|MAINT|DIST|API|APP|AGENT)-0[0-9]' \
  AGENTS.md CLAUDE.md docs .agents/skills/react-router .codex .github scripts src public test-utils \
  biome.json components.json package.json tsconfig.json vite.config.ts react-router.config.ts
```
