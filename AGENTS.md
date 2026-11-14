# Agent instructions

This repository maintains a React Router SPA starter and the references it follows.
Nothing here permits publishing, pushing, merging, or sending messages.

## Map

| Path | What it is |
| --- | --- |
| `starter/` | The starter; apps are generated from it. `starter/AGENTS.md` governs work inside it. |
| `references/app-reference/` | Data Mode and Framework Mode reference app. Its `docs/` are the conventions. |
| `references/widget-builder-pattern/` | Widget and dashboard design guidance. |
| `references/notes/` | Dated, unmaintained notes. |
| `maintainers/` | Starter status, backlog, decisions, and maintenance. |

## Rules

- `references/app-reference/docs/conventions.md` is authoritative. A convention
  change lands there first, then in the starter, in the same change.
- Files under `starter/` never mention `maintainers/`, `references/`, or the
  `template-*` skills; apps receive them.
- Work on a branch. Don't push or create remotes without the owner.

## Checks

- `starter/`: `npm ci && npm test`; the "Keep apps clean" grep in
  [maintainers/README.md](maintainers/README.md#keep-apps-clean); a generated app's
  `npm test`, with and without `--no-examples`.
- `maintainers/`: from `starter/`,
  `npx vitest run --root .. --dir ../maintainers --environment node`.
- `references/app-reference/`: `npm ci && npm run check`.

## Skills

`.agents/skills` (`.claude/skills` links there): `template-task` for changes to the
starter or its backlog, `template-maintenance` for dependency and registry refreshes.
