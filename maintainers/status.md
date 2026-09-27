# Status

Updated 2026-09-27. Tagged `v0.1.0` in the local repository; nothing is pushed.

## Verified state

Run on 2026-09-27 with Node 23.7.0 and npm 10.9.2, not the preferred Node 24 and npm
11.19.0. npm warns that vitest, jsdom, and some transitive packages don't list Node 23
in their engines.

| Check | Result |
| --- | --- |
| `npm test` | Pass: Biome, typegen + tsc, 38 tests in 10 files, SPA build. Vite warns that the `/examples/components` chunk is 681 kB (recharts); the entry chunk is unchanged at 182.5 kB. |
| Fresh clone of the commit | `npm ci` and `npm test` pass (38 tests). From the clone, `bin/create-react-spa.mjs` makes a full app (35 tests pass) and a `--no-examples` app (5 tests pass); `--offline` installs from the cache. |
| Rendered, dev server | Pacer: debounce, URL write, results, deep link. Components: every family renders; dialog, alert dialog, sheet, popover, menu, and command palette return focus; menus skip disabled items; command palette filters; dark theme renders every family; no page-level overflow at 390 px (a long word now wraps). Form and table checks from 2026-09-26 still apply. |
| Rendered, generated app's `npm run preview` | Direct loads of `/examples/pacer?q=sample` and `/examples/components` render, the theme script is in `<head>`, no console errors |
| Regression checks | Each fails a test when removed: the search debouncer's unmount cancel, the stale-search guard, and the command palette's `Command` wrapper (plus the 2026-09-26 form and table checks) |
| "Keep apps clean" grep; relative-link check over every `.md` | Empty; 0 broken links. The CLI tests run the same grep over a generated app. |

The starter has the Framework SPA shell, the aria-nova catalog (see the
[UI inventory](ui-inventory.md)), `lib/form`, `lib/theme`, `lib/url-state`, five
removable examples, and `bin/create-react-spa.mjs`.

Not verified: reduced motion in a browser (the CSS rule is in place; QUALITY-01 will
emulate it), toast placement in a screenshot (the DOM shows it on screen), screen-reader
output, Node 24 or npm 11, a real static host, and hosted CI and Dependabot (not pushed).
`npm audit` reports a moderate Vitest advisory (dev only; MAINT-02).

## Completed

| Work | Result | Evidence |
| --- | --- | --- |
| Intake audit fixes | Every audit finding resolved except the MAINT-02 row (Zustand mock, Lefthook) | Source inspection and `npm test`, 2026-09-26 |
| DEMO-01 Form | `/examples/form`: text, email, select, textarea, and checkbox fields; Zod schema; errors after blur or submit; a Query mutation owns submission; duplicate-submit guard; recoverable failure; reset. `lib/form` provides `useAppForm` with Aria-wired fields, `Form`, and `SubmitButton`. | 4 route tests, checks above |
| DEMO-02 Table v9 | `/examples/table`: `useTable` with registered features, row IDs, sort, search, status filter, paging, and page size in the URL; selection with indeterminate state across pages; column visibility; empty and past-the-end states; loader skipped for search-only changes. | 7 route tests, 2 URL tests, checks above |
| UI-01 Aria catalog | All 52 installable aria-nova components with hashes, dependencies, licenses, and local changes in the [inventory](ui-inventory.md). `drawer` (Base UI) left out for `sheet`. `/examples/components` shows every family with keyboard, focus return, disabled, validation, dark theme, and long content; `lib/theme` adds the theme toggle and head script; `index.css` adds reduced motion. | 4 route tests, checks above |
| DEMO-03 Pacer | `/examples/pacer`: a debounced URL search (Query results, stale answers never win, IME, clearing, Enter to flush, Cancel, unmount and Back cancel) and a throttled autosave through a Query mutation (Save now, Discard, flush on unmount). Components use the view-plus-hook pattern. | 8 controlled-time tests, checks above |
| DIST-01 and DIST-02 | [Decision 0002](decisions/0002-distribution.md): own repository, private, MIT, SemVer tags. `bin/create-react-spa.mjs` copies an allowlist, renames package and lockfile, records provenance, and supports `--no-examples`, `--no-install`, and `--offline`. create-react-router's `--template` was ruled out (copies starter files, adds the upstream skill). | 3 CLI tests, fresh-clone checks above |
| Starter/app split | Starter tracking moved to `maintainers/` and the `template-*` skills. Apps get `AGENTS.md`, `README.md`, and three docs. `docs/README.md` removed. Markdown cut from 8,227 to 5,848 words (app-inherited docs: 3,728 to 2,444) with hedges removed. | Checks above |

## Active

None.

## Next

1. DIST-03 once the owner says go: create the private remote, push `main` and
   `v0.1.0`, and confirm CI and Dependabot.
2. QUALITY-01. It now has five example routes, dark and reduced-motion emulation, and
   the CLI's generated app to cover.
3. MAINT-02: the Vitest advisory, React 19.3, shadcn's `cn` package, the Zustand mock,
   and Lefthook.
4. DEMO-04, then MAINT-01.

Install Node 24 locally (`nvm install 24`) so checks run on the preferred runtime.
