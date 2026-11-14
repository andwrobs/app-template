# Recipes

Step-by-step procedures for the changes made most often. Each names the files it
touches. When a step says to decide, the linked page has the rule.

Part of the [app reference](README.md).

## Add a page in Data Mode

1. Create the folder `src/routes/<route>/`.
2. `<route>.queries.ts`: query options for the data the page reads
   ([server data](server-data.md#keys-and-options)).
3. `<route>.page.tsx`: export `<Route>Page`. Read with `useSuspenseQuery` and the
   same options; render a `<title>` and one `<h1>`.
4. `<route>.route.ts`: export `<route>Route = defineRoute({ path, page, load })`.
   In `load`, parse search params, `await queryClient.ensureQueryData(…)` for what
   the page can't render without, and return nothing.
5. Add it to the tree in `src/routes.ts`, under the shell route if it needs a
   session.
6. Add capabilities as sibling folders, each exposing one connected component.
7. `<route>.route.test.tsx`: with `renderRoute` and `stubApi`, it loads, and it
   shows Not found for an id the server doesn't have.

## Add a page in Framework Mode

Use the [Framework Mode example](../framework/README.md) and
[routing guide](framework-routing.md). Keep `defineRoute` in Data Mode.

1. Create the feature folder under the configured `appDirectory`.
2. `<route>.page.tsx`: export the named page component, with props typed as
   `Route.ComponentProps` imported from `./+types/<route>.route`.
3. `<route>.route.ts`: import the page, then `export default <Route>Page`. Add
   `clientLoader` and any boundary the route needs. No JSX in this file.
4. Register it in `routes.ts` with `route(path, "routes/<route>/<route>.route.ts")`,
   under the shell layout if it needs a session. The file path is relative to
   `appDirectory`.
5. Don't use the shorthand `export { X as default } from …` in the route module:
   the page would receive no props.
6. To retain this reference's Query ownership, warm the shared browser client in
   `clientLoader` and read the same options in the page. Return `null` when no
   loader data is needed. A server `loader` needs a separate hydration design if
   its results will feed the browser cache ([server data](server-data.md)).
7. Run framework type generation, type checking and a production build. Check the
   route through the framework's running app; the Data Mode `renderRoute` helper
   does not accept a Framework `RouteConfigEntry` ([testing](testing.md)).

## Put state in the URL

1. Confirm Back, reload or a shared link should restore it
   ([routing](routing.md#what-lives-in-the-url)).
2. Add the field to the schema in `<route>.search.ts`, with `.catch` for its
   default.
3. Add a write function to the route's search hook. Replace for a filter; push for
   a place.
4. If it changes what the server returns, add it to the query key and read it in
   the route's Data Mode `load` or Framework `clientLoader` with the same parser
   when following the Query pattern.

## Add a write

1. Decide who observes it ([commands](state/commands.md)). One hook: steps 2 to 4.
   Several capabilities: "Add a command slice" below.
2. Add the call to the service.
3. Add a hook to the domain's `.mutations.ts`: `useMutation` with `onSettled`
   invalidating the broadest key the write could change.
4. Use it in the capability's feature hook; return intent and status, and show
   failure with `classifyFailure`.
5. Optimistic only if it is one field, rarely refused, and exactly reversible.

## Give a screen a store

Do this the first time two capabilities need the same state.

1. Create `<route>.store.ts`: state and actions types, `createXStore(deps)`, and
   the context from `createRouteStoreContext` ([route stores](state/route-stores.md)).
2. Create `<route>.provider.tsx`: build the ports, and render the store's provider
   with `key` set to the subject's id. Render it in the page, around everything
   that reads the store.
3. Move the shared state into a slice (next recipe).
4. Add `<route>.store.test.ts` that builds the store from plain functions.

## Add a slice

1. Check the state passes the test: two capabilities read it, or another
   capability's action changes it.
2. In the capability's folder under the route's `lib/`, write the pure transitions (`<capability>-state.ts`)
   and test them.
3. Write `<capability>.slice.ts`: one state type, one actions type, one deps type,
   and `create<Capability>Slice(scope, deps)` that applies the transitions.
4. In the store file: add the key to state and to `actions`, create the slice with
   `scope("<capability>")`, pass its ports and any callbacks to other slices, and
   add it to `startAll` if it returns `start`.
5. If it needs something from outside, add the port to the store's deps type and
   build it in the route's provider.
6. Read it in the capability's feature hook with a selector.

## Add a command slice

1. Write the transitions in `<capability>-flow.ts`: state with a `request`, and
   functions that return a step (`{ next, send? }`). Include the transition that
   takes a reply and checks its key.
2. Test every transition: start, confirm, retry (same key), each settled result,
   and a reply that is no longer awaited.
3. Write the slice: a `run` function that sets `step.next`, sends through the port
   and hands the reply to the finishing transition.
4. Declare the port: `send<Thing>(intent): Promise<Settled<Thing>>`, never
   rejecting, plus `newKey()`.
5. Build the port in the route's provider: call the service, map a failure with
   `classifyFailure`, and invalidate in `finally`.
6. Wire effects on other capabilities as callbacks in the store file.

## Add a setting

1. Confirm the viewer would expect it on another device. If not, it is device
   memory ([app state and persistence](state/app-state-and-persistence.md)).
2. Add the field, its default and its setter to `settings.store.ts`.
3. Add it to `partialize` and validate it in `merge`.
4. Export a hook from `settings.ts`, and a port if a loader or a route store needs
   it.
5. If it changes what the server returns, make it the fallback for a search param
   so it reaches the query key.

## Change a persisted shape

1. Bump `version`.
2. In `migrate`, bring the old shape forward for every earlier version.
3. Keep `merge` validating the result.
4. Test: an old stored value loads as the new shape; a corrupted one falls back to
   defaults.

## Remember something on this device

1. Create a persisted store in the `src/lib` capability that uses it, over
   `viewerStorage`, with `skipHydration`, `partialize`, `version` and `merge`.
2. Subscribe to `onViewerChange` and `onStoredChange` to load.
3. Keep ids, never copies of server data, and cap how many.

## Add an app-lifetime store

1. Confirm the state must survive leaving the screen, and isn't server data, a
   setting or device memory. This is a design decision; write down why.
2. Create `<name>.store.ts` in a `src/lib` capability with `create`, the standard
   shape, and exported selector hooks.
3. Render its one piece of UI in the shell, if it has any.
4. Give route stores a port to it, never the store.

## Return focus across capabilities

1. Confirm the dialog or library doesn't already do it.
2. Add the target names to the screen's focus scope.
3. Attach always-present targets with `ref={focus.ref(name)}`; record transient
   ones with `focus.remember(name, element)` in the handler.
4. Have the closing transition set a focus intent in state.
5. In one lifecycle hook, claim the intent after the close commits and call
   `focus.restore` with the targets in order of preference.

## Smells and their fixes

The data-loading rows below describe this reference's Query ownership policy.
Framework `loaderData`, actions and fetchers are valid alternatives when chosen
as the data owner; they are not inherently architectural smells.

| If you see | It means | Do instead |
| --- | --- | --- |
| A `useEffect` that copies one state into another | Two owners for one fact | Derive it, or delete the copy and read the owner |
| `useState` initialized from query data | A copy that will go stale | Read the query; seed forms through their own default values |
| `getState()` during render | A value read without subscribing | A selector hook |
| A subject id stored in route store state | The store outlives its subject | Key the provider by the subject |
| A `reset()` or `clear()` action on a route store | The same | Key the provider by the subject |
| A slice importing a store, a service or the Query client | A missing port | Declare the need in `deps`; build it in the route's provider |
| A setter passed without a getter | A decision split across two places | A port with `get` and `set` |
| `invalidateQueries` in an effect or after `navigate` | A refresh with no owner | Invalidate in the write's `onSettled` or the port's `finally` |
| `localStorage` outside the storage adapter | A second persistence path | A persisted store over `viewerStorage` |
| A handler in JSX that awaits, branches or retries | A workflow with no owner | An intent on the feature hook or an action on the slice |
| Two setters called in sequence by a consumer | A leaking boundary | One action named for the intent |
| `isLoading` checks for required Query data in a page | A route that didn't warm the cache | `ensureQueryData` in Data Mode `load` or Framework `clientLoader`, `useSuspenseQuery` in the page |
| Both loader data and Query independently owning the same records | Two data owners | Choose one owner; in this reference, warm Query and read it from the page |
| A query key written inline | A key no write can find to invalidate | The key factory in the domain's `.queries.ts` |
| A 401 check in a loader or a hook | Session handling in the wrong place | The shell's middleware and the Query client's handler |
| `setTimeout` in a component or store | A timer with no owner | A debouncer owned by the hook or the store's creator |
| A DOM node or ref in a store | Focus state in the wrong place | A focus scope, and a focus intent in state |
| A mock of a hook or a store in a test | A test of the mock | Stub `fetch`; pass plain functions as ports |
