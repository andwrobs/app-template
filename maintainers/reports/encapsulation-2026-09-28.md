# Encapsulation audit — 2026-09-28

Source reviewed: `app-foundations`, commit
`a6a2a5c32dcce6745948fd62cfbd26d607fa7230`, before this documentation change.
Scope: all route entry points; form, table, query, and Pacer behavior; component
catalog state sites; shared form, URL, theme, API, and app integration; relevant
route tests; architecture instructions and app generation. Design-system import restrictions were reviewed; registry UI internals were not
exhaustively reviewed for correctness.
This is an ownership audit, not a security or dependency audit.

## Conclusion

The library ownership choices are mostly sound, but encapsulation is inconsistent.
Form and Table implement workflows inside rendering components. Pacer separates
behavior from views but makes the route wire private feature hooks. Existing docs
explicitly teach that wiring, so the problem is partly the instructions themselves.
The desired default is a named feature owner with a narrow public interface, a thin
connected entry point, and a view that renders state and emits intent.

No application implementation was changed by this audit. Priorities below express
refactor order and contract risk, not newly proven production failures.

## Findings

### 1. Table mixes presentation with several adaptation policies — high

Evidence: [table.route.tsx](../../src/routes/examples/table/table.route.tsx),
`TableRoute` (lines 80–136) constructs the Query/URL/draft/Table integration. JSX
handlers further down merge page selection, map column visibility, update the search
draft and filter together, and translate sorting descriptors.

A reader must inspect both setup and JSX to discover the rules for one interaction.
Changing selection behavior or URL history requires editing the page layout module.
The existing [URL helpers](../../src/routes/examples/table/table-url-state.ts) are a
useful pure boundary, but they don't encapsulate the whole workflow.

Target: a route-private `TaskTable` feature whose hook owns Query, URL, Table, and
Aria adaptation. Its view receives the required rendering bindings and named actions;
it does not perform selection merges or sequence draft/URL writes. Keep loader,
metadata, revalidation, and route error boundaries in the route module. Preserve
Table's state ownership and Router's URL ownership; no additional store.

Acceptance: existing seven route tests and two URL tests pass; deep links, Back,
replace-versus-push history, selection across pages, hidden columns, and recovery
still work. Inspect callbacks as well as the top of the file: moving only the hook
setup leaves half the problem behind.

### 2. Form submission and reset have no single feature interface — high

Evidence: [form.route.tsx](../../src/routes/examples/form/form.route.tsx),
`FormRoute` (lines 21–39) configures scenario selection, mutation, schema parsing,
success reset, and the submitting subscription. The Reset button later sequences
`form.reset()` and `mutation.reset()` inside its JSX handler.

The route must know how both owners cooperate. Extract a `ProjectRequestForm`
feature with a private `useProjectRequestForm` hook owning submission, recovery,
and reset actions. Keep field layout in the view and TanStack Form as field-state
owner. `lib/form` remains the shared integration adapter, including duplicate-submit
handling. Do not copy its state into Zustand or invent a parallel form framework.

Acceptance: preserve the existing four tests for validation, transformed submission,
duplicate submits, retry, and reset. The route composes the feature; the view calls
one reset action. The colocated
[project-request schema/defaults/types](../../src/routes/examples/form/project-request.ts)
are appropriate and should remain together.

### 3. Pacer exposes feature assembly to the route — medium

Evidence: [pacer.route.tsx](../../src/routes/examples/pacer/pacer.route.tsx),
lines 3–19 and the final feature renders, imports each view and hook independently.
The two feature barrels also expose hooks and timing constants.

The [search hook](../../src/routes/examples/pacer/components/DebouncedSearch/useDebouncedSearch.ts)
and [autosave hook](../../src/routes/examples/pacer/components/ThrottledAutosave/useThrottledAutosave.ts)
already own meaningful workflows, and their views render props. This is a smaller
boundary problem than Form/Table, not a reason to replace their internals wholesale.

Target: connected `DebouncedSearch` and `ThrottledAutosave` public entries, each
binding its private hook to its view. The route renders those entries directly.
Tests may import private timing constants directly when needed; consumers shouldn't
have to know the assembly. Do not add a route-wide controller that combines these
independent lifecycles merely to reduce the number of hook calls.

Acceptance: preserve the eight route tests, especially stale answers, Back, IME,
clearing, unmount cancellation, serialized saves, and unmount flushing. A narrow
barrel alone is not enough; each feature owns its wiring.

### 4. Autosave cancellation has an unresolved public contract — medium

Evidence: `useThrottledAutosave` documents a Pacer limitation for edits queued behind
a running save, but `onDiscard` delegates directly to `cancel()`.
[ThrottledAutosave.tsx](../../src/routes/examples/pacer/components/ThrottledAutosave/ThrottledAutosave.tsx)
says Discard drops the waiting save.
The [discard test](../../src/routes/examples/pacer/pacer.route.test.tsx) waits for
previous saves to finish before exercising discard. It doesn't establish the claim
for an edit queued during an active request.

This is a documented limitation and coverage gap; this audit did not reproduce the
active-request case. Resolve it before calling the example's action contract complete:
start save A, queue edit B before A completes, discard B, finish A, and advance all
relevant timers. Assert exact saved values and visible status. The feature must
implement the advertised guarantee or expose the actual limitation through its
control availability and wording. Also exercise a failed save and recovery; the
current save fixture and mock always succeed.

### 5. Instructions encourage inconsistent boundaries — high, addressed here

Evidence: the previous [code-organization guide](../../docs/code-organization.md)
explicitly had `projects.route.tsx` call `useFilterBar` and spread its result into a
view. The new-route skill described views and hooks without naming a feature owner.
The repository entry-point instructions did not state the ownership preference.

Changed here: repository AGENTS.md now states the preference and requires identifying
the owner for behavior changes; code/data docs define roles and action contracts;
the new-route skill applies those decisions. App generation already copies these
files, so full and bare generated apps inherit them. All changes are repository
scoped. The user's global instructions remain unchanged.

These are review rules, not a claim that lint now proves encapsulation. Existing
Biome restrictions enforce some import directions; they don't establish workflow
ownership. Avoid hook-count or file-length checks as substitutes.

## Sound boundaries and proportionate exceptions

- [Home](../../src/routes/home/home.route.tsx) is static composition; no extraction.
- [Query](../../src/routes/examples/query/query.route.tsx) has straightforward
  subscriptions and a refetch action, with options/schema already colocated. No
  substantial workflow to split today. Extract an owner if coordination grows.
- `lib/api`, `lib/form`, `lib/url-state`, and `lib/theme` are named capabilities.
  Theme has real shared consumers. Form fields adapt library state to Aria; they
  are intentional bindings, not supposedly pure business views.
- `RouteFocus` has one explicit app lifecycle responsibility. Header/sidebar theme
  subscriptions and closing the mobile menu are small UI bindings.
- Catalog toggles, selection, and dialog-open state may stay local. The timed
  pending-button simulation in `InputsSection` is a small follow-up: isolate its
  lifecycle or use explicit demo controls if it grows; it doesn't justify a store.

## Follow-up sequence

1. Form: establish the reference feature boundary using existing behavior tests.
2. Table: extract the coordinated owner, including JSX adaptation handlers.
3. Pacer: close the public interface and resolve the cancellation/recovery contract.

Track implementation acceptance in [the backlog](../backlog/ui-and-examples.md).
Verification commands and actual results for this documentation change are recorded
in [status](../status.md). Source inspection and existing tests cannot guarantee
future agents follow the rules; review the ownership decision in each behavior change.
