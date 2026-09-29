# UI and examples

Read [data and forms](../../docs/data-and-forms.md) and [maintenance](../maintenance.md).
Example routes must be removable without touching shared UI or providers, and must use
visibly synthetic fixtures with no credentials or external services.

## DEMO-04 Query mutations and route integration

P2 · M · Build. Depends on: none. Builds on `/examples/form` and `lib/form`.

**Outcome:** a form mutation with one submission owner, Query invalidation, route
revalidation, and recovery, with no duplicate requests or stale screens.

**Acceptance:** a typed fixture transport with deterministic success and failure.
Covers stale and fresh cache, queries shared across routes, retry and recovery,
clearing the cache when identity changes, and loading on back, forward, and deep links.
Explains the `fetchQuery` or `ensureQueryData` choice. No real server.

**Checks:** tests on visible post-mutation state and request counts, rendered pending
and recovery, baseline.

## ARCH-01 Encapsulate the project request workflow

P1 · S · Build. Depends on: none. See the
[encapsulation audit](../reports/encapsulation-2026-09-28.md).

**Outcome:** `FormRoute` composes a `ProjectRequestForm` feature. A private hook owns
submission, parsed values, success reset, recovery, and explicit reset. Its view
renders fields and invokes actions. Keep the schema/defaults colocated and the
existing Form/Query ownership intact.

**Acceptance:** no reset or submission sequences in JSX; consumers do not assemble
private hooks or coordinate form and mutation setters. Preserve validation,
transformed submissions, duplicate-submit protection, answers on failure, retry,
and reset behavior.

**Checks:** four existing form route tests, baseline, rendered form states.

## ARCH-02 Encapsulate task table behavior

P1 · M · Build. Depends on: none. See the
[encapsulation audit](../reports/encapsulation-2026-09-28.md).

**Outcome:** a route-private `TaskTable` feature owns Query/URL/Table/Aria adaptation,
including the transitions currently embedded in JSX. Route exports keep framework
responsibilities; the view renders bindings and invokes named actions.

**Acceptance:** preserve URL/history policy, search draft, sort/filter/page state,
selection across pages, visibility, and empty/error recovery without duplicate state
or a new global store. Pure URL helpers stay beside the feature.

**Checks:** seven existing table route tests and two URL tests, baseline, rendered
keyboard, selection, navigation, and recovery states.

## ARCH-03 Close Pacer boundaries and verify cancellation

P1 · M · Build. Depends on: none. See the
[encapsulation audit](../reports/encapsulation-2026-09-28.md).

**Outcome:** the route composes connected search/autosave entries; each owns its
private hook-to-view binding. Public discard behavior agrees with what the UI
promises, including work queued during an active save.

**Acceptance:** preserve search IME, stale-answer handling, Back and unmount behavior,
serialized autosave, and flushing. Reproduce save A in flight, edit B queued, then
discard B; assert saved values and visible state after A and all timers finish.
Resolve any contract mismatch in behavior or control availability/wording. Exercise
save failure and recovery with a deterministic mock. Keep independent feature
lifecycles separate.

**Checks:** eight existing Pacer route tests plus the missing contract cases,
baseline, rendered waiting/saving/discard/failure states.
