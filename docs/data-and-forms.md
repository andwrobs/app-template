# Data, forms, tables, and rate control

## Router and Query

These libraries remain the sources of truth. A feature hook coordinates them behind
the [behavior boundary](code-organization.md#behavior-ownership); it doesn't create a
second cache or copy their state. Views call feature actions and render their result.

Router owns URL state, navigation timing, route boundaries, and client loaders and
actions. Query owns remote state: caching, freshness, deduplication, and invalidation.

- Define query options beside their owner and use them in both `clientLoader` and
  `useQuery`, through the one client in `src/lib/query/client.ts`. Tests use their
  own caches.
- `fetchQuery` in a loader reuses fresh data and waits for stale data.
  `ensureQueryData` returns stale data immediately, so use it only when that's what
  you want. `prefetchQuery` is for speculative warming, and its errors don't reach
  route boundaries.
- Fetch with `lib/api`: `fetchJson` parses with a Zod schema and throws one
  `ApiError` whose `kind` is `network`, `http`, or `invalid-response`; `api` resolves
  paths against `VITE_API_URL`. Pass Query's `signal`; aborts pass through. Don't
  cancel shared keys when leaving a route, because another consumer may need them.
- With auth, put the user scope in query keys, and cancel and clear those queries when
  the identity changes.
- Don't copy remote data into Zustand, loader return values, or effects.

## Forms

Use TanStack Form v1 with Zod v4 through Standard Schema, with no Hook Form. Aria owns
labels, focus, relationships, and keyboard. TanStack owns value, touched state,
validation, and submission.

- Put FieldLabel, FieldDescription, and FieldError inside the Aria field (`TextField`,
  `Select`, `CheckboxField`) so Aria links them to the control. shadcn's Aria examples
  put the label beside the control, which leaves it unlinked. The TanStack binding
  (`useAppForm`) is in `lib/form`.
- Wire value, onChange, onBlur, isInvalid, and error text explicitly. Aria's onChange
  passes a value, not an event.
- Have one validation owner. If TanStack validates, set `validationBehavior="aria"`
  and don't repeat errors from the browser or the schema.
- Handle schema transforms at submit. Parsed output doesn't replace field values.
- Have one submission owner: a Query mutation, or a `clientAction` through a fetcher
  when route semantics matter. Block duplicate submits, show failures, and invalidate
  the affected queries on success. Router revalidation doesn't invalidate fresh Query
  data.
- Keep parse-submit-success-reset and explicit reset/retry behavior in the form
  feature's hook. Field layout belongs in its view. Keep the schema and defaults
  colocated with the form domain; a schema beside its consumer isn't a design flaw.

## Tables and rate control

Table is v9. Many shadcn Data Table snippets are v8 (`useReactTable`, row models).
Use one semantic table with one selection and sort state, and never nest an Aria table
in a native one. Define row IDs. Keep filters and sort in the URL when they should
survive navigation.

With an Aria Table, Aria owns semantics, keyboard, and selection gestures, and Table
owns the state. Aria sees only the rendered page, so pass it that page's selection
and merge its changes by row ID. Skip the loader for search-only navigations
(`shouldRevalidate`) when the data doesn't depend on them. A search box backed by the
URL keeps its own text (`lib/url-state`), because the URL updates after typing.

The table feature owns URL/Table/Aria adaptation, including selection merging and
history policy. Its view receives renderable state and named callbacks rather than
implementing those transitions inside JSX.

Pacer is pinned at 0.23.0. Use its React adapter, not custom timer hooks. Cancel
pending work on unmount, treat cancel and flush differently, handle IME composition,
and never let a stale search overwrite a newer one. Debounce a value by delaying its
URL write; pace a mutation with an async throttler and let Query own the call. For
autosave, flush on unmount so the last edit saves: in 0.23.0, `cancel()` can't stop an
edit queued behind a running save.

Keep draft, scheduling, cancellation, flushing, and recovery under one feature owner.
Its public actions must describe what they actually guarantee, including the
difference between pending and in-flight work. Test a queued edit during a running
save as well as a timer waiting while idle; the two cases can behave differently.

Use Router's NavLink for navigation state, Zustand for shared client state (the theme
in `lib/theme`), and local state for everything else.

## Examples

- `/examples/query`: a Zod-validated JSON fixture with empty and error cases. It isn't
  a backend.
- `/examples/form`: errors after blur or submit, a mutation as submission owner, a
  recoverable failure, and reset.
- `/examples/table`: sort, search, filter, and paging in the URL, selection across
  pages, and column visibility.
- `/examples/pacer`: a debounced URL search and a throttled autosave.
- `/examples/components`: every `lib/ui` component, in light and dark.

## References

[React Router SPA](https://reactrouter.com/8.4.0/how-to/spa) ·
[Query with a router](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching) ·
[TkDodo](https://tkdodo.eu/blog/react-query-meets-react-router) ·
[shadcn TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form) ·
[Form](https://tanstack.com/form/latest) · [Table](https://tanstack.com/table/latest) ·
[Pacer](https://tanstack.com/pacer/latest) · [React Aria](https://react-aria.adobe.com/)
