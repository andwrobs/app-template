# Status

Updated 2026-09-27. `main` is tagged `v0.1.0`; branch `app-foundations` holds one
commit per item below, unmerged. Nothing is pushed.

## Verified state

Run on 2026-09-27 with Node 23.7.0 and npm 10.9.2, not the preferred Node 24 and npm
11.19.0. npm warns that vitest, jsdom, and some transitive packages don't list Node 23
in their engines.

| Check | Result |
| --- | --- |
| Fresh clone of `app-foundations` | `npm ci` and `npm test` pass: Biome, typegen + tsc, 60 tests in 18 files, SPA build (Vite warns about the 681 kB `/examples/components` chunk; the entry chunk is unchanged). A generated full app passes 52 tests; a `--no-examples` app passes 21. |
| `new-route` skill, followed in a generated bare app | Added `/things` with query options, loader, error boundary, nav entry, and 3 tests; `npm test` passed |
| Rendered, dev server | Skip link is the first Tab stop and moves focus to the content; header navigation focuses the new `h1` and sets the title; typing in the table's search keeps focus; unknown URLs show the not-found page; the sidebar layout (swapped in temporarily) marks the current page, collapses to icons, and at 390 px opens a sheet that closes after a choice, with focus on the new heading. Earlier checks of the examples and components still apply. |
| Rendered, `npm run preview` | Direct loads of `/no/such/page` and `/examples/table?status=done&page=2` render with their titles; no console errors |
| `VITE_API_URL=ftp://…` build | Fails with the setting and fix named; a normal build passes |
| Upstream report, live | 52 of 52 registry components and the Router skill source unchanged; 27 packages behind ([report](reports/upstream-2026-09-27.md)) |
| "Keep apps clean" grep; relative-link check over every `.md` | Empty; 0 broken links |

The starter has the Framework SPA shell with titles, route focus, a skip link, and
not-found and error pages; header and sidebar layouts; the aria-nova catalog;
`lib/api`, `lib/env`, `lib/form`, `lib/meta`, `lib/theme`, and `lib/url-state`; five
removable examples; the `new-route` and `react-router` app skills; the CLI; and the
monthly upstream report.

Not verified: reduced motion in a browser (QUALITY-01), screen-reader speech, the
scheduled report's first run (due 2026-10-01), Node 24 or npm 11, a real static host,
and hosted CI (not pushed).

## Completed

| Work | Result | Evidence |
| --- | --- | --- |
| Intake audit fixes | Every audit finding resolved except the MAINT-02 row (Zustand mock, Lefthook) | Source inspection and `npm test`, 2026-09-26 |
| DEMO-01 Form | `/examples/form`: text, email, select, textarea, and checkbox fields; Zod schema; errors after blur or submit; a Query mutation owns submission; duplicate-submit guard; recoverable failure; reset. `lib/form` provides `useAppForm` with Aria-wired fields, `Form`, and `SubmitButton`. | 4 route tests, checks above |
| DEMO-02 Table v9 | `/examples/table`: `useTable` with registered features, row IDs, sort, search, status filter, paging, and page size in the URL; selection with indeterminate state across pages; column visibility; empty and past-the-end states; loader skipped for search-only changes. | 7 route tests, 2 URL tests, checks above |
| UI-01 Aria catalog | All 52 installable aria-nova components with hashes, dependencies, licenses, and local changes in the [inventory](ui-inventory.md). `drawer` (Base UI) left out for `sheet`. `/examples/components` shows every family with keyboard, focus return, disabled, validation, dark theme, and long content; `lib/theme` adds the theme toggle and head script; `index.css` adds reduced motion. | 4 route tests, checks above |
| DEMO-03 Pacer | `/examples/pacer`: a debounced URL search (Query results, stale answers never win, IME, clearing, Enter to flush, Cancel, unmount and Back cancel) and a throttled autosave through a Query mutation (Save now, Discard, flush on unmount). Components use the view-plus-hook pattern. | 8 controlled-time tests, checks above |
| DIST-01 and DIST-02 | [Decision 0002](decisions/0002-distribution.md): own repository, private, MIT, SemVer tags. `bin/create-react-spa.mjs` copies an allowlist, renames package and lockfile, records provenance, and supports `--no-examples`, `--no-install`, and `--offline`. create-react-router's `--template` was ruled out (copies starter files, adds the upstream skill). | 3 CLI tests, fresh-clone checks above |
| APP-01, APP-02, APP-03 | Titles from `lib/meta` on every route and in `index.html`; a catch-all not-found route and a styled root error boundary; `RouteFocus` and a skip link in the layouts | 9 tests, checks above |
| APP-04 Sidebar shell | `SidebarLayout` swaps in for `AppLayout` in `root.tsx`; both read `lib/app/nav.ts`; `SidebarInset` renders a `div` | 3 tests, checks above |
| APP-05, API-02 | `lib/env` schema checked by `vite.config.ts`, `.env.example` for apps; `lib/api` with `ApiError` kinds, used by the examples | 6 tests, checks above |
| AGENT-01 `new-route` skill | App skill for adding a page; `AGENTS.md` points to it and the CLI copies it | Followed in a generated app |
| MAINT-01 Upstream report | `maintainers/check-upstream.mjs` and the "Starter upstream report" scheduled task (1st of the month, 09:00, new worktree and branch, never pushes) | 5 tests, one live report |
| Starter/app split | Starter tracking moved to `maintainers/` and the `template-*` skills. Apps get `AGENTS.md`, `README.md`, and three docs. `docs/README.md` removed. Markdown cut from 8,227 to 5,848 words (app-inherited docs: 3,728 to 2,444) with hedges removed. | Checks above |

## Active

None.

## Next

1. Review and merge `app-foundations` into `main`, then tag `v0.2.0` (see
   maintenance.md, Releases). The scheduled report uses `main` once it has the script.
2. DIST-03 once the owner says go.
3. QUALITY-01, now including the not-found URL, route focus, and the sidebar layout.
4. MAINT-02, starting from the upstream report: Vitest 5 (fixes the advisory),
   TypeScript 7, jsdom 30, and the rest.
5. DEMO-04, then MAINT-03 and API-01.

Install Node 24 locally (`nvm install 24`) so checks run on the preferred runtime.
