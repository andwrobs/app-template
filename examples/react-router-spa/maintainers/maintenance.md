# Maintenance

npm packages, shadcn source copied into `src/lib/ui`, and agent skills and docs are
refreshed separately. The lockfile covers only packages.

## Intake

- `npm run deps:check` lists declared, locked, and latest versions. It writes nothing.
- Dependabot (weekly npm, monthly Actions, grouped, no auto-merge) runs only once this
  folder is a GitHub repository root, which it isn't yet.
- `node maintainers/check-upstream.mjs` reports changed or new registry components
  (hashes vs the [inventory](ui-inventory.md)), a newer create-react-router than the
  skill came from, and packages behind their latest release. It tells a fetch failure
  apart from no change and changes nothing; `--save` writes
  `maintainers/reports/upstream-<date>.md`.
- A local scheduled task ("Starter upstream report") runs it on the 1st of each month
  in a new worktree on `upstream/<YYYY-MM>`, files backlog items there, and commits on
  that branch. Review and merge the branch; it never pushes or upgrades.
- Turn significant upstream changes into a backlog item.

## React Router

1. Read the release notes, engines, and migrations. Move `react-router`,
   `@react-router/dev`, and `@react-router/node` to the same exact version. Don't add
   `@react-router/serve`.
2. `npm pack create-react-router@<version>` in a temporary directory, then read
   `package/dist/agent-skills/react-router/` and its license.
3. Merge relevant changes into `.agents/skills/react-router`, keeping it SPA-only, and
   update `references/upstream.md`.
4. Regenerate types, run `npm test`, and check first hydration and direct-route
   refresh on the production build.

## React Aria and shadcn

1. Read the React Aria release notes and the shadcn Aria changelog. Keep `aria-nova`,
   `rsc: false`, and the `src/lib/ui` aliases.
2. Update packages with npm. Keep `shadcn` installed, because `src/styles/index.css`
   imports `shadcn/tailwind.css`.
3. Generate with `npm run ui:add -- <names>` in a scratch copy. Review imports,
   registry dependencies, CSS, licenses, and Aria state behavior. Never overwrite in
   bulk; `--all` isn't a reviewed inventory.
4. Merge what you want and keep local edits. Record source URL, date, and hash in the
   [inventory](ui-inventory.md), because a pinned CLI doesn't pin registry content.
5. Render affected examples in light and dark, with keyboard, at narrow and wide sizes,
   and in disabled, validation, overlay, and reduced-motion states. Check bundle size.

## Everything else

Read the docs for each locked major, especially Query v5 caching, Form v1 Standard
Schema, Table v9, and Pacer (pre-1.0, pinned exactly). Keep react and react-dom in
step, and the test and coverage packages in step. Update in small groups.

Run `npm install`, then a clean `npm ci` and the checks. Never use `--force` or
`--legacy-peer-deps`; tell stale lock metadata apart from real peer conflicts. Note
each deliberate deferral and why.

## Releases

1. Finish the checks: `npm test` (which runs the CLI tests), the "Keep apps clean"
   grep, and a generated app's `npm ci` and `npm test` from a fresh clone.
2. Run `npm version X.Y.Z --no-git-tag-version`, which updates `package.json` and only
   the lockfile's root entries, and add a changelog entry. Don't edit versions by
   search and replace: other packages share version strings.
3. Commit, then tag `vX.Y.Z` on that commit. Push the branch and tag only with the
   owner's go-ahead.

## Recording

In status, record versions before and after, upstream sources and dates, local
adaptations, commands and results, rendered evidence, and gaps. Update the README,
docs, and skills in the same change. Publish only with separate authorization.
