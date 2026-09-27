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
