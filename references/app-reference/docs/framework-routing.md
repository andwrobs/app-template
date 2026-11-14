# Routing (Framework Mode)

The Framework SPA variant lives under [`framework/`](../framework/README.md).
It keeps the same Query data and client-state features as the Data Mode example,
and uses React Router's Vite plugin for route modules, generated types, and code
splitting. The configuration is `appDirectory: "src"`, `ssr: false` relative to
the `framework/` workspace.

## Choose the routing pattern by mode

| Concern | Data Mode (`src/`) | Framework Mode (`framework/src/`) |
| --- | --- | --- |
| Route registration | `defineRoute` returns a factory for runtime `RouteObject`s | `routes.ts` calls `route()` and `layout()` directly |
| Route tree | `createRoutes(deps)` feeds `createBrowserRouter` | `routes.ts` default-exports a `RouteConfig` |
| Runtime behavior | `path`, `page`, `load`, `guard` in `defineRoute` | Native exports in the registered `.route.ts` |
| Page types | Helper infers params from the path and checks page props | `Route.ComponentProps` generated for the registered module |
| Required Query data | `load` warms an injected Query client | `clientLoader` warms a module-level browser Query client |
| Session prerequisite | `guard` becomes runtime middleware | Native `clientMiddleware` on the shell route |
| Chunks | The page is its own chunk; `load` ships up front | One chunk per route; `splitRouteModules` (on by default) loads `clientLoader` apart from the component when they share no module-level code |
| App entry | `app.tsx` creates the router and providers | `root.tsx` supplies document, providers, fallback and boundary |

Keep `defineRoute` for Data Mode. Framework Mode needs no helper of its own:
`route()` already is the function that creates a route entry.

## What changes, and why it matters

Three rules from the rest of this reference are different here. Everything else
carries over.

- **The Query client is a module-level instance, not injected.** `clientLoader`
  and `clientMiddleware` are plain exports with no place to receive `RouteDeps`,
  so they import the client from `lib/query-client.client.ts`, and `root.tsx`
  gives the same instance to the provider. This reverses "nothing imports a
  shared client" from [server data](server-data.md). The cost is in tests: they
  share that instance, so each test clears it (`queryClient.clear()` in
  `afterEach`).
- **The guard is the shell's `clientMiddleware` export**, not a `guard` option.
  It runs before every loader beneath the shell, as the Data Mode guard does.
- **Splitting the page from the route file is for reading, not loading.** The
  framework already makes a chunk per route, and with `splitRouteModules` (on by
  default) it loads `clientLoader` apart from the component, so the loader can
  start while the page downloads. That only works when the two share no
  module-level code, which a `.route.ts` with no JSX and no shared helpers
  guarantees.

## One place for the tree

```ts
// framework/src/routes.ts
import { layout, type RouteConfig, route } from "@react-router/dev/routes";

// The whole tree, in one place. File paths are relative to appDirectory
// (framework/src). src/root.tsx wraps this tree; it is not an entry here.
export default [
	route("sign-in", "routes/sign-in/sign-in.route.ts"),
	layout("routes/app-shell/app-shell.route.ts", [
		route("projects/:projectId", "routes/project/project.route.ts"),
	]),
	route("*", "routes/not-found/not-found.route.ts"),
] satisfies RouteConfig;
```

`routes.ts` is the only file that calls `route()`, `layout()` or `index()`, and
the only one that imports `@react-router/dev/routes`. The path and the module
file sit side by side, and the whole tree reads top to bottom.

- **File paths are relative to `appDirectory`**, not to `routes.ts`.
- **No per-route factory files.** A `project.routing.ts` that returns one
  `route(...)` call holds a single path string, adds a file to every route, and
  moves the tree out of the one place it can be read. When the tree outgrows one
  screen, split `routes.ts` by area (`routes/admin.routes.ts` exporting an array
  of entries), not by route.
- **Root is special.** The framework wraps the tree in `src/root.tsx`
  automatically.
- A route that has children renders an `<Outlet />` where they belong.

## The registered route module

```ts
// framework/src/routes/project/project.route.ts
import { projectTasksOptions } from "~/routes/project/project.queries";
import { parseProjectSearch } from "~/routes/project/project.search";
import { queryClient } from "../../lib/query-client.client";
import type { Route } from "./+types/project.route";
import { ProjectPage } from "./project.page";

// Import, then `export default`: the compiler adds route props only to a default
// export declaration. `export { ProjectPage as default } from …` gets none.
export default ProjectPage;

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
	const { order } = parseProjectSearch(new URL(request.url).searchParams);
	await queryClient.ensureQueryData(projectTasksOptions(params.projectId, order));
	return null;
}
```

The module uses the native `clientLoader` export. It reads generated params,
parses the URL, awaits the shared Query options, and returns `null`. Query remains
the owner of the data in this example. Other applications may return data through
`loaderData` and choose React Router to own it.

Use an explicit `import { ProjectPage } ...` followed by
`export default ProjectPage`. The framework's compiler adds route props
(`params`, `loaderData`) only to an `export default` declaration. The shorthand
`export { ProjectPage as default } from "./project.page"` is not transformed, so
the page would render with no props. The framework loads and splits the route;
there is no `defineRoute` or manual lazy import here.

## How the separate Page gets its types

```tsx
// framework/src/routes/project/project.page.tsx
import type { Route } from "./+types/project.route";
import { ProjectView } from "./project-view.client";

// Types come from the registered route module, even though its component lives
// in another file. params.projectId is string, inferred from the path in routes.ts.
export function ProjectPage({ params }: Route.ComponentProps) {
	return <ProjectView params={params} />;
}
```

The import is `./+types/project.route`, because **`project.route.ts` is the
registered module**. There is no generated `+types/project.page` unless that file
is itself registered as a route. Any sibling file can import the generated route
types with `import type`; this adds no runtime import cycle.

`Route.ComponentProps` includes typed params and the route's loader/action data.
For this path, `params.projectId` is a `string`; changing the path changes the
generated contract. Returning data from a loader changes the inferred
`loaderData` type. Types alone do not provide runtime props: the registered
default component receives them through the framework.

In this variant the Page is a small typed adapter to the shared `ProjectView`.
The shared view takes ordinary `params` props. Its `.client.ts` entry keeps the
Data Mode example's browser-only stores out of the build's server-side module
evaluation. A page written entirely for Framework Mode can keep its UI directly
in `project.page.tsx` and use browser APIs only at the appropriate lifecycle or
client boundary.

Use the normal Framework TypeScript setup: generated `.react-router/types` in
`include`, `rootDirs` configured, and `react-router typegen` before `tsc` in CI.
Do not handwrite generated declarations or replace them with casts to make a
check pass.

## Always split the page

Every route is a `.route.ts` and a `.page.tsx`, including small ones.

- `.route.ts` holds what the router runs: the default export, `clientLoader`,
  `clientMiddleware`, boundaries. It contains no JSX.
- `.page.tsx` holds the screen, typed with `Route.ComponentProps`.

One shape means nobody decides per route, no route is renamed from `.route.tsx`
to `.route.ts` when it grows, and a search for `.page.tsx` finds every screen.
It is also the same shape as Data Mode, so a route moves between modes by
changing its `.route.ts` alone.

## The shared browser cache and initial load

The Framework provider and `clientLoader` import the same browser Query client.
The example's client module constructs it once using the shared factory from
the Data Mode source. Do not create a second client in a loader: the page would
miss the data the loader prepared.

The root exports the document `Layout`, `HydrateFallback`, a default component
that installs providers, and a server-safe `ErrorBoundary`. `ssr: false` still
prerenders the root document/fallback during the build. Browser-only code must
not execute at module scope in a module evaluated there. This example uses
`.client.ts` boundaries for the browser Query client and shared Project view.

With client-only route loading in this SPA, the initial fallback remains while
the first loaders prepare the page. For a future SSR version, decide explicitly
whether a `clientLoader` runs during hydration and how server data reaches the
browser cache. A server `loader` cannot warm the browser's in-memory Query client;
use loader data directly or provide a deliberate dehydration/hydration path.
Never use a process-global Query client for user-specific server requests.

## Session and failure behavior

The shell's native `clientMiddleware` calls `requireSession` before its descendant
client loaders. A parent `clientLoader` is not an ordering substitute, because
matched loaders can run in parallel. Its unauthorized case redirects to sign-in
with the return URL. Services still require authorization at the API.

Framework boundaries are native exports; `defineRoute` no longer installs them
automatically. A root boundary catches failures that have no nearer boundary.
Add a route boundary when a page failure should preserve the surrounding shell,
and keep boundaries needed during prerendering free of browser assumptions.

## Adopting the pattern

1. Keep shared services, Query options, URL parsers, stores, and feature components.
2. Register every route with `route()` or `layout()` in the default-exported
   `routes.ts` configuration.
3. Replace each `defineRoute` with native module exports: `clientLoader`,
   `clientMiddleware`, default component, and the required boundaries.
4. Type the registered component or its separate Page with the generated `Route`
   types. Use explicit default exports in registered modules.
5. Install the one browser Query client through the Framework root and share it
   with client loaders. Check browser-only imports during the SPA build.
6. Replace the manual router bootstrap with Framework configuration. Permit
   required default exports in lint rules for route and configuration modules.
7. Run the commands in the [example README](../framework/README.md). Verify direct
   refresh, initial loading, client navigation, the session guard, search params,
   typed params reaching the page, cache reuse, and failure boundaries. The Data
   Mode `renderRoute` utility does not consume `RouteConfigEntry` values.

## References

- [React Router routing](https://reactrouter.com/start/framework/routing)
- [Route module exports and props](https://reactrouter.com/start/framework/route-module)
- [How generated types work](https://reactrouter.com/explanation/type-safety)
- [TypeScript configuration and typegen](https://reactrouter.com/how-to/route-module-type-safety)
- [Automatic code splitting](https://reactrouter.com/explanation/code-splitting)
- [SPA rendering](https://reactrouter.com/how-to/spa)
- [Middleware](https://reactrouter.com/how-to/middleware)

These sources explain framework behavior. The `.route.ts`/`.page.tsx`
names and Query ownership policy are conventions chosen by this reference.
