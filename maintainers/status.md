# Status

Updated 2026-09-28. `main` includes the app foundations and encapsulation audit,
fast-forwarded from `app-foundations`. Branch `encapsulation-refactors` holds ARCH-01,
02, and 03, staged but not committed. The latest release tag is `v0.1.0`; these
changes are unreleased. Nothing is pushed.

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

## Encapsulation audit verification — 2026-09-28

Repository-only guidance and audit; application source unchanged. Global Codex
instructions were checked after the interrupted write and remain empty/unchanged.

- `npm test`: exit 0; Biome, route typegen/TypeScript, 60 tests in 18 files, and SPA
  build passed on Node 23.7.0/npm 10.9.2. The build emitted the large components-chunk
  warning and `EMFILE` file-watcher errors but completed and generated index.html.
  Chart dimension warnings also appeared in jsdom tests.
  This does not establish a warning-free build or preferred-runtime verification.
- Keep apps clean: no matches. Relative Markdown links: 65 checked, no missing
  targets. `git diff --check`: passed.
- `quick_validate.py .agents/skills/new-route`: passed using a temporary Python
  environment with PyYAML (system Python lacked it). No rendered check needed for this
  documentation-only change. No new behavior tests were added or failure scenarios
  reproduced; the audit distinguishes source findings from coverage gaps.

## Encapsulation refactors — 2026-09-28

ARCH-01/02/03 on `encapsulation-refactors`, Node 23.7.0/npm 10.9.2.

- Form: `ProjectRequestForm` (connected entry, view, `useProjectRequestForm`) owns the
  scenario, mutation, parse-save-clear, and `resetRequest`. The route only composes.
- Table: `TaskTable` owns Query/URL/Table wiring and every Aria translation (page
  selection merge, column visibility, sort descriptor, status key, search draft).
  The view binds Aria callbacks straight to named actions and renders with the
  standalone `FlexRender`. URL helpers and columns moved into the feature folder.
- Pacer: connected `DebouncedSearch` and `ThrottledAutosave` entries; barrels export
  only them; tests import timing constants from the hooks.
- Autosave contract, reproduced first with a scratch test against the old code:
  Discard was disabled with an edit queued behind a leading save, which then saved;
  with a trailing save running, Discard left the queued edit to save; Save now
  started a second concurrent save (`maxInFlight` 2) and saved the text twice. Fix:
  each request gets a revision; waiting is derived from requested versus started
  (`save.variables`) or discarded; the save skips discarded revisions; Save now is
  enabled only while nothing saves. Added a failing-server checkbox and Try again,
  which returns focus to the note.
- `npm test`: exit 0; Biome (146 files), typegen + tsc, 62 tests in 18 files, build
  (the large components-chunk warning; jsdom chart-size warnings as before).
  New: discard behind leading and trailing saves; failure, continued failure, retry.
  Pacer file passed 3 consecutive runs. Keep apps clean: no matches.
  `git diff --check`: passed.
- Relative links: 65 checked, 1 missing: the dated audit links the old
  `table/table-url-state.ts`, now `table/components/TaskTable/`. Left as a record.
- Rendered, dev server, 1440×900: form failure keeps answers, Reset clears them,
  pending disables Submit and Reset, success trims and clears; table deep link,
  typing keeps focus and replaces history, empty-state recovery, keyboard selection
  kept across Next and Back, Columns menu hides Priority and returns focus; autosave
  with real timers shows "Saving… Newer edits are waiting.", Discard leaves 2 saves
  and "Unsaved changes." after 3 s, failure alert, retry saves; debounced search
  unchanged. 390×844: no page overflow on the three routes; failure state renders.
  No console or server errors.
- Not verified: at 390×844 (touch emulation) pointer clicks didn't toggle either the
  new checkbox or the form's existing one; keyboard did. Automation or a real
  `lib/ui` touch issue, so it belongs to QUALITY-01. From Pacer's source, not
  reproduced: a save longer than the 1 s interval stops the throttler waiting and
  can start a second save. The search's Try again may drop focus the same way the
  autosave's did (not checked).

## Completed

| Work | Result | Evidence |
| --- | --- | --- |
| ARCH-01, ARCH-02, ARCH-03 | `ProjectRequestForm`, `TaskTable`, and connected Pacer entries own their workflows; routes compose. Autosave discard drops edits queued behind a running save, Save now can't overlap a save, and failed saves recover. | 21 form/table/URL tests unchanged, 10 Pacer tests (2 new), refactor section above |
| Encapsulation audit and guidance | [Audit](reports/encapsulation-2026-09-28.md), repository ownership rules, and new-route skill updated. Application refactors remain ARCH-01/02/03. | Verification above |
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

1. Review and commit `encapsulation-refactors`, then merge it into `main`.
2. Prepare `v0.2.0` when requested (see maintenance.md, Releases). The scheduled
   upstream report can now use the script on `main`.
3. DIST-03 once the owner says go.
4. QUALITY-01, now including the not-found URL, route focus, the sidebar layout, and
   checkbox pointer input at phone width.
5. MAINT-02, starting from the upstream report: Vitest 5 (fixes the advisory),
   TypeScript 7, jsdom 30, and the rest.
6. DEMO-04, then MAINT-03 and API-01.

Install Node 24 locally (`nvm install 24`) so checks run on the preferred runtime.
