# App reference

How a React single-page app is put together on React Router, TanStack Query,
TanStack Form and Zustand: what each library owns, how a page gets its data, how
state is kept, how writes are done, and how the pieces are tested. Every rule
comes with its reason, so it can be applied to a case these pages don't cover.

Assumes React 19, React Router 8, TanStack Query 5, TanStack Form, Zustand 5,
Zod 4 and TypeScript in strict mode. The main `src/` example uses Data Mode
(`createBrowserRouter`). The [Framework SPA variant](../framework/README.md)
uses the Vite plugin, native route modules, and generated types. One
example runs throughout: a project page at `projects/:projectId` that lists tasks,
with a selection, a details panel and an Archive command. Its source is under
`src/` beside these pages, and every code block that starts with a file path is
that file, kept in sync by `sync-docs.py`. See the [setup and checks](../README.md)
for the commands that validate each mode.

## Pages

| Page | Covers |
| --- | --- |
| [Data Mode routing](routing.md) | Route, page and queries files, the `defineRoute` helper, loading, search params, the session guard, errors, pending UI, focus |
| [Framework Mode routing](framework-routing.md) | What differs from Data Mode, `routes.ts`, native `.route.ts` exports, generated page props, shared cache, SPA root, migration and checks |
| [Server data](server-data.md) | The API client, services, errors, the Query client, keys, reading, mutations |
| [State](state/README.md) | Who owns each kind of state, route stores, slices, ports, commands, persistence, focus scopes |
| [Session](session.md) | Who is signed in, how a session ends, per-person storage |
| [App shell](app-shell.md) | Composition roots, where code lives, capabilities, notices, dialogs, shell patterns |
| [Conventions](conventions.md) | File names, functions, types, comments, size: the choices an agent can't infer |
| [Testing](testing.md) | What to test at each level, and the route test utilities |
| [Recipes](recipes.md) | Step-by-step procedures, and a table of smells with their fixes |
| [Enforcement and review](state/enforcement-and-review.md) | Lint rules, review checklists, and the alternatives these rules replace |
| [Glossary](glossary.md) | Every term, with one meaning each |

Start with this page, then [recipes](recipes.md) for the change in hand.

## Who owns what

| Concern | Owner |
| --- | --- |
| Which page a URL shows, navigation, URL state, failure boundaries | React Router |
| Everything the server holds, and every request's freshness | TanStack Query |
| A form's draft, validation and submission | TanStack Form |
| One screen's shared client state | A route store (Zustand), keyed by the screen's subject |
| State that outlives every screen | An app-lifetime store (Zustand) in `src/lib` |
| What survives a reload | Persisted stores over one storage adapter, per viewer |
| Everything one component reads | The component |

## How a page works

```text
URL ──► guard (session) ──► load (warm the cache) ──► page renders       
                                                              │
        component ◄── feature hook ◄── Query cache            │ reads
            │              ▲                                  │
            │ intent       └── route store ◄── ports ◄── provider    
            ▼
        mutation or command ──► service ──► API ──► invalidate the cache
```

1. **The guard** on the shell route makes sure there is a session before anything
   under it loads.
2. **The route's `load` (Data Mode) or `clientLoader` (Framework SPA)** parses the
   URL and awaits the data the page can't render without. The helper's `load`
   returns nothing; the native `clientLoader` returns `null` after warming Query.
3. **The page** reads that data from the cache with the same query options, and
   composes its capabilities.
4. **A capability** is a view, a feature hook and a connected component. The hook
   joins the cache, the URL, settings and the screen's store.
5. **A write** is a mutation when one hook observes it and a command slice when
   several capabilities do. Either way it goes through a service and then
   refreshes the cache.
6. **Leaving the subject** unmounts the screen's store. Leaving the session
   reloads the page.

## The decisions that shape everything else

1. **One owner per piece of state, and no copies.** Every stale-data bug is a copy
   that didn't hear about a change.
2. **This reference's loaders warm the Query cache.** They return no server data
   to the component. One cache means one way to refresh. Native route loader data
   is a valid alternative in apps that choose Router to own it.
3. **This reference's writes use Query mutations or command slices.** One write
   path means one way to invalidate. Framework actions remain available for apps
   that choose them and explicitly coordinate Query invalidation.
4. **A store lives exactly as long as what it describes.** Keyed by subject, it
   needs no reset, no subject ids and no guards against late replies.
5. **Rules are pure functions.** They are where the tests go, because they are
   cheap to test there.
6. **Stores receive ports.** They can be built from plain functions, and survive a
   provider changing.
7. **The write refreshes the cache, and a failed write is classified once.**
   Uncertain is never shown as failed.
8. **Session change is a page load.** Nothing has to remember to reset.
9. **One of each:** one API client, one Query client, one storage adapter, one
   media-query adapter, one routing convention per mode, one place the route tree is
   assembled, one place services are built.
10. **A new pattern is a decision.** If a change needs a lifetime, a persistence
    mechanism or a way of coordinating that these pages don't have, decide it on
    purpose and write it down first. The second way of doing something is what
    erodes a codebase.
