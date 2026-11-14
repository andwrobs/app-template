# Glossary

The terms the [app reference](README.md) uses. Each has one meaning throughout.

## Ownership and lifetime

| Term | Meaning |
| --- | --- |
| Owner | The one place a piece of state lives and is changed. Every piece of state has exactly one. |
| Lifetime | How long state exists: a component's, one subject on screen, the tab, or this browser across reloads. |
| Server data | What the server holds, and anything computed from it. Query owns it under this reference's data policy. Also called remote data. |
| URL state | What Back, reload and a shared link should restore, kept in the path and search params. |
| Client state | State the server doesn't hold: a selection, an open panel, a request in progress. |
| Derived state | A value computed from other state. It is computed where it is read and never stored. |
| Mirror | A copy of a value another owner holds. Avoided, because the copy goes stale. Allowed only when a change in the value is itself a transition for the store. |
| Screen | What one route renders. Also called a page. |
| Subject | What a screen describes: the project a project page shows. A screen with no subject describes the route itself. |
| Capability | One thing a screen or the app does, in its own folder: under the route's `lib/` (`lib/selection/`, `lib/details/`, `lib/archive/`) or in `src/lib`. |
| Key (React) | The `key` prop on a store's provider, set to the subject's id. A new key unmounts everything under the provider and mounts it again with a new store. |

## Routing

| Term | Meaning |
| --- | --- |
| Data Mode route | `<route>.route.ts`: the path, `load`, an optional guard and the lazy page import, built with this reference's `defineRoute`. |
| Framework route module | `<route>.route.ts`: the registered module with native exports such as a default component, `clientLoader`, `loader` and `ErrorBoundary`. The suffix is a project convention, not automatic file discovery. |
| Page | The screen a route renders. `<route>.page.tsx` reads data and the URL and composes capabilities; Framework Mode pages can import `Route.ComponentProps` from their registered route module's `./+types/<route>.route`. |
| Generated route types | Framework Mode's `Route` types for a registered module, produced from the route configuration and module exports during development or `react-router typegen`. |
| Queries file | `<name>.queries.ts`: query keys and options. `.mutations.ts` holds the mutation hooks beside it. |
| Provider file | `<route>.provider.tsx`: builds the route store's ports and provides the store, keyed by the subject. |
| Data Mode `load` | This reference's callback that warms the Query cache before the page renders and returns nothing. `defineRoute` adapts it to a React Router loader. |
| Framework `clientLoader` | A native route export that loads in the browser. Under this reference's Query policy it warms the provider's shared browser cache and returns `null`. |
| Framework `loader` | A native route export that runs on the server or during prerendering and returns loader data. Feeding its results into browser Query requires an explicit hydration path. |
| Warm | To put data in the Query cache before the component that reads it renders. |
| Middleware | A function that runs before every loader beneath its route, in order. Used once, for the session guard. |
| Guard | The shell's middleware that requires a session before any signed-in page loads. |
| Shell | The layout route that wraps every signed-in page and renders what stays on screen: navigation, the progress indicator, app-wide UI. |
| Search params | The `?name=value` part of the URL. Each route's search module names, parses and writes them. |
| Search module | `<route>.search.ts`: the schema for a route's search params, its parser and its hook. |
| Filter | A search param that refines what a page shows (sort, a tag). Changing it replaces the history entry. |
| Place | A search param that is somewhere the user went (an open preview, a tab). Changing it adds a history entry, so Back returns. |
| Error boundary | A route's `ErrorBoundary`: what renders when its loader or component throws. |
| Pending | A navigation whose loader hasn't finished. The current page stays on screen, with one indicator in the shell. |
| Revalidation | The router running loaders again. With this reference's `ensureQueryData` policy it does not itself invalidate Query; native loader-data applications can use revalidation to refresh their data. |

## Server data

| Term | Meaning |
| --- | --- |
| API client | The one module that calls `fetch`. It resolves to data or throws an `ApiError`. |
| Service | A stateless set of functions, one per API call, built by a factory from the API client. |
| Composition root | The one place something is built and handed out: `services.ts` for services, Data Mode `app.tsx` for the client and router, Framework `root.tsx` for root providers, `routes.ts` for the route tree, the route's provider file for a store's ports. |
| Query options | A query's key and fetch function in one object, shared by the loader and every component that reads it. |
| Query key | The array that names a cache entry. It includes everything that changes what the server returns. |
| Key factory | The object that builds a domain's keys from broad to narrow, so a write can invalidate a prefix. |
| Cache | Query's store of server data, keyed by query key. The data owner under this reference's Query policy. |
| Stale | Cached data older than its `staleTime`. It is still shown, and refetched when next read. |
| Invalidate | To mark cached data stale so it refetches. Done by the write that changed it, and by nothing else. |
| Optimistic update | Showing a change before the server confirms it, and putting it back if the server refuses. For cheap, exact, rarely refused changes only. |
| Transient failure | No reply, or a 5xx. Worth one automatic retry for a read; never for a write. |
| Classifier | `classifyFailure`: the one function that says whether a failed write is failed or uncertain. |

## Stores

| Term | Meaning |
| --- | --- |
| Store | A Zustand store: state, plus the actions that change it. |
| Route store | A store for one screen's shared client state, created for one subject and dropped when that subject leaves the screen. |
| App-lifetime store | A store that outlives every screen, built once with Zustand's `create`, in a `src/lib` capability. Also called a global store. |
| State | The data in a store. In a route store its keys are slice names. |
| Action | A function on a store that changes its state. Actions sit under one `actions` key, an object that never changes. |
| Selector | The function a component passes to a store hook to pick the value it renders. The component re-renders only when that value changes. |
| Slice | One capability's part of a route store: one key of state and one key of actions, created by `create<Capability>Slice`. |
| Slice scope | What a slice receives for reaching the store: `get()` and `set(next, action)` for its own key only. `scope("key")` makes one. |
| `start` | A function beside `actions` that begins a store's subscriptions and returns the function that stops them. The provider runs it when it mounts. |
| Creator | The function that builds a store: `createXStore(deps)`. It has no side effects, so React may call it twice in development. |
| Kit | `~/lib/route-store`: the context, provider, hooks and slice scopes every route store is built with. |
| Provider | The component that creates a route store and makes it available to everything under it. |
| Registration | How a screen contributes to an app-lifetime store: an effect registers while the screen is mounted, and its cleanup withdraws. |
| Pending question | A question work is waiting on, held in an app-lifetime store: state holds what to show, and the promise's resolver stays private. |

## Dependencies

| Term | Meaning |
| --- | --- |
| Deps | The single argument a store or slice creator takes, holding everything it needs from outside. |
| Port | One dependency: a function, or a small object of functions, named for what the store needs (`sendArchive(intent)`, `newKey()`, `dockedOpen.get()`). The store calls it without knowing what is behind it. The route's provider file supplies the real one; a test supplies a plain function. |
| Read through | Calling a port for a current outside value at the moment an action needs it, instead of keeping a copy in state. |
| Adapter | The one module allowed to touch a browser API: the storage adapter for `localStorage`, the media-query adapter for `matchMedia`. |

## Capabilities

| Term | Meaning |
| --- | --- |
| View | A component that renders what it is given and reports what the user did. It imports no store, query or router hook. |
| Feature hook | A hook that joins the owners for one capability (store, Query, settings, the URL) and returns what its view renders and the intents it can raise. |
| Connected component | The component that binds a feature hook to its view. It is what a page renders. |
| Intent | What the user asked for, as plain data or a named function: the tasks to archive; `archive`, `retry`, `discardDraft`. |
| Notice | A short message about work that finished away from where the user is looking. The result of something they just did shows beside it instead. |

## Transitions and commands

| Term | Meaning |
| --- | --- |
| Transition | A pure function that takes state and an intent and returns the next state. The rules live here; slices only apply them. |
| Step | What a command's transition returns: the next state and, when there is one, the request to send. |
| Command | A write: something the user does that the server must carry out. |
| Mutation | A command with one observer, run by `useMutation` in a feature hook. Query owns its request state. |
| Command slice | A slice that runs a command several capabilities observe: transitions return steps, and the slice applies them and sends through a port. |
| Request state | Where a request stands: idle, sending, failed or uncertain. It lives where its observers are. |
| Idempotency key | An id made for one request and sent with it, so a retry of the same request is recognized by the server as the same one. |
| Settled result | What a sending port resolves to: done, failed with a reason, or uncertain. It never rejects. |
| Failed | The server refused (a 4xx), and nothing changed. |
| Uncertain | No readable reply arrived, so the server may or may not have done the work. A state of its own, never shown as a failure. |
| Awaited reply | The reply to the request currently in state, matched by its key. Only it changes what shows. |
| Late reply | A reply that arrives after its request was superseded or its store dropped. It changes nothing on screen. |
| Claim | To read a one-shot request from state and clear it in the same action, so it is carried out once. |

## Session and persistence

| Term | Meaning |
| --- | --- |
| Session | Who is signed in. Server data, read through a query. |
| Viewer | The signed-in person, as far as this browser's storage is concerned. Every persisted key ends in their id. |
| Session end | Signing out, a 401, or another tab signing out. Always a page load to the sign-in page, which drops everything in memory. |
| Return path | Where to go after signing in: a path on this site, never a full URL. |
| Persistence path | The one way anything survives a reload: Zustand's `persist` with `partialize`, over the storage adapter. |
| `partialize` | The `persist` option that names exactly which state is kept. |
| Store hydration | Loading a persisted store's saved values. Deferred (`skipHydration`) until the viewer is known. Distinct from React hydration and hydrating a Query cache with server data. |
| Migration | Bringing values saved under an older `version` forward to the current shape, in `migrate`. |
| Setting | A choice the viewer would expect on another device: a view, a density, a panel left open. Also called a preference. It will sync. |
| Device memory | What this browser remembers and no other should: expanded tree nodes, recent items. It never syncs. |

## Environment and focus

| Term | Meaning |
| --- | --- |
| Environment | Facts about the browser the app reacts to: breakpoints, pointer type. |
| Docked | A panel shown as a column beside the content, on a wide screen. On a narrow one it is an overlay (a drawer or sheet). |
| Focus target | An element focus may move to. |
| Focus scope | The named focus targets one screen's capabilities share, kept outside the store. |
| Focus intent | A serializable note in store state that focus is owed somewhere (`focusRequest: "return"`). A hook claims it and carries it out with the focus scope. |

## Testing

| Term | Meaning |
| --- | --- |
| Network boundary | `fetch`. The only thing a route test replaces. |
| Stub | A stand-in reply for a request, keyed by method and path. |
| Route test | A test that renders a route through the router with stubbed replies and asserts what the user sees. |
| Rendered check | Looking at the running app at desktop and phone sizes, with a keyboard, before calling UI work done. |
