# Routing (Data Mode)

How routes are declared, how a page gets its data, what lives in the URL, and what
happens while a page loads or fails. React Router runs in data mode: route objects
passed to `createBrowserRouter`, with no file-based conventions and no code
generation. These are the conventions for this archive's top-level `src/`.
For the Vite plugin, native route exports and generated Page types, use [Framework Mode routing](framework-routing.md).

Part of the [app reference](README.md).

## The router's job

The router owns four things: which page a URL shows, when navigation happens, what
the URL holds, and which boundary catches a failure. In this reference, Query owns
server data. Loaders
exist to make data ready before a page renders, and the data itself lives in the
Query cache ([server data](server-data.md)).

## A route is a few files, each with one role

Every route has a folder. Files at its root are named `<route>.<role>.ts`, so the
role is in the name and a search for `.route.ts` or `.queries.ts` finds every one.

| File | Holds | Exports |
| --- | --- | --- |
| `project.route.ts` | Everything the router runs before the page renders: the path, what to load, a guard, which page to import | `projectRoute` |
| `project.page.tsx` | The screen: reads the cache and the URL, composes capabilities | `ProjectPage` |
| `project.queries.ts` | Query options for the data this route reads | `projectTasksOptions` |
| `project.search.ts` | The route's search params: schema, parser, hook | `parseProjectSearch`, `useProjectSearch` |
| `project.store.ts` | The screen's shared client state, when capabilities share any ([route stores](state/route-stores.md)) | `createProjectStore` |
| `project.provider.tsx` | Builds the store's ports and provides it, keyed by the subject | `ProjectProvider` |
| `app-shell.layout.tsx` | For a layout route: what surrounds its children, with an `<Outlet />` | `AppShellLayout` |

A route has only the files it needs. A static page is a `.route.ts` and a
`.page.tsx`. Everything else the route owns sits under the route's `lib/`
([app shell](app-shell.md#where-code-lives)).

Why split the route from the page: `.route.ts` is plain TypeScript the router
needs up front, and it is small. `.page.tsx` is the screen's code, loaded only
when the route matches. Keeping them apart keeps every page out of the first
download and lets the loader start while the page's code is still arriving.

## The route file

```ts
// src/routes/project/project.route.ts
import { defineRoute } from "~/lib/router/define-route";
import { projectTasksOptions } from "./project.queries";
import { parseProjectSearch } from "./project.search";

export const projectRoute = defineRoute({
	path: "projects/:projectId",
	page: async () => (await import("./project.page")).ProjectPage,
	async load({ params, search }, { queryClient }) {
		const { order } = parseProjectSearch(search);
		await queryClient.ensureQueryData(projectTasksOptions(params.projectId, order));
	},
});
```

Every Data Mode route is built by one helper, so every route is put together the
same way. It builds runtime `RouteObject`s; Framework Mode has no equivalent and needs
none.

```tsx
// src/lib/router/define-route.tsx
import type { QueryClient } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
	type LoaderFunctionArgs,
	type MiddlewareFunction,
	type PathParam,
	type RouteObject,
	useParams,
	useRouteError,
} from "react-router";
import { RouteError } from "~/lib/app/route-error";

/** What every route may need from the app. `app.tsx` builds it once. */
export type RouteDeps = { queryClient: QueryClient };

/** Data Mode route factory. `routes.ts` supplies deps and children; Framework Mode needs no helper: `routes.ts` calls `route()` directly. */
export type RouteFactory = (deps: RouteDeps, children?: RouteObject[]) => RouteObject;

/** The path's params, all present: `"projects/:projectId"` gives `{ projectId: string }`. */
export type RouteParams<Path extends string> = { [Name in PathParam<Path>]: string };

/** The props a page receives. */
export type PageProps<Path extends string> = { params: RouteParams<Path> };

type RouteConfig<Path extends string> = {
	/** The URL segment. Leave out for a layout that adds none. */
	path?: Path;
	/** The parent's default child. An index route has no path and no children. */
	index?: true;
	/** Loads the page (or layout) when the route first matches, so its code stays out of the first download. */
	page(): Promise<ComponentType<PageProps<Path>>>;
	/**
	 * Warms the Query cache with what the page can't render without. It returns
	 * nothing: the page reads the cache with the same query options.
	 */
	load?(
		args: { params: RouteParams<Path>; search: URLSearchParams; request: Request },
		deps: RouteDeps,
	): Promise<void>;
	/** Runs before every loader at or under this route. */
	guard?(deps: RouteDeps): MiddlewareFunction;
	/** Shown while the first page loads. Set it on the root route. */
	fallback?: ComponentType;
};

function RouteErrorBoundary() {
	return <RouteError error={useRouteError()} />;
}

/**
 * Data Mode only. Builds a route object the same way every time: a lazy page that receives
 * its params, a loader that only warms the cache, and an error boundary.
 */
export function defineRoute<const Path extends string = "">(
	config: RouteConfig<Path>,
): RouteFactory {
	return function createRoute(deps, children) {
		const route = {
			middleware: config.guard ? [config.guard(deps)] : undefined,
			loader: config.load
				? async ({ params, request }: LoaderFunctionArgs) => {
						await config.load?.(
							{
								// The router matched this path, so its params are present.
								params: params as RouteParams<Path>,
								search: new URL(request.url).searchParams,
								request,
							},
							deps,
						);
						return null;
					}
				: undefined,
			async lazy() {
				const Page = await config.page();
				function RoutePage() {
					return <Page params={useParams() as RouteParams<Path>} />;
				}
				return { Component: RoutePage };
			},
			ErrorBoundary: RouteErrorBoundary,
			HydrateFallback: config.fallback,
		};
		if (config.index) return { ...route, index: true };
		return { ...route, path: config.path, children };
	};
}
```

What the helper settles, so no route has to:

- **`load` returns nothing.** Its type is `Promise<void>`, so a loader can't hand
  data to the page. The page reads the cache.
- **The page is lazy.** `page` is a dynamic import, so each page is its own chunk.
- **Params are typed from the path.** `"projects/:projectId"` gives `load` and the
  page `{ projectId: string }`. A page whose props don't match its route's path
  fails to compile.
- **Dependencies are passed in.** `load` and `guard` receive `RouteDeps`. Nothing
  imports a shared Query client, so a test hands each route its own.
- **Every route has an error boundary.** A failure replaces that page and nothing
  around it.

## The route tree

One file assembles every route. Folders never nest to mirror URLs; nesting is
decided here.

```ts
// src/routes.ts
import type { RouteObject } from "react-router";
import type { RouteDeps } from "~/lib/router/define-route";
import { appShellRoute } from "./routes/app-shell/app-shell.route";
import { notFoundRoute } from "./routes/not-found/not-found.route";
import { projectRoute } from "./routes/project/project.route";
import { rootRoute } from "./routes/root/root.route";
import { signInRoute } from "./routes/sign-in/sign-in.route";

/**
 * The whole route tree, in one place. Folders never nest to mirror URLs:
 * nesting is decided here.
 */
export function createRoutes(deps: RouteDeps): RouteObject[] {
	return [
		rootRoute(deps, [
			signInRoute(deps),
			appShellRoute(deps, [projectRoute(deps)]),
			notFoundRoute(deps),
		]),
	];
}
```

```tsx
// src/app.tsx
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "~/lib/app/app-providers";
import { createQueryClient } from "~/lib/query/query-client";
import { createRoutes } from "./routes";

// The app's composition root: one Query client, shared by the routes (for
// loaders and guards) and the provider (for components).
const queryClient = createQueryClient();
const router = createBrowserRouter(createRoutes({ queryClient }));

export function App() {
	return (
		<AppProviders queryClient={queryClient}>
			<RouterProvider router={router} />
		</AppProviders>
	);
}
```

`app.tsx` is the app's composition root. It creates the one Query client and gives
it to both the routes and the provider, so a loader and the page it feeds use the
same cache.

## Loading data

```ts
// src/routes/project/project.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { taskKeys } from "~/lib/tasks/tasks.queries";
import type { TaskOrder } from "~/lib/tasks/tasks.service";
import { getTaskService } from "~/services";

/** The project's tasks. The loader and the page both use it, so they share one cache entry. */
export function projectTasksOptions(projectId: string, order: TaskOrder) {
	return queryOptions({
		queryKey: taskKeys.list(projectId, order),
		queryFn: ({ signal }) => getTaskService().list(projectId, order, signal),
	});
}
```

The loader and the page use the same query options, so they share one cache
entry. The loader awaits it; the page reads it. Nothing is passed between them.

| Call | Does | Use for |
| --- | --- | --- |
| `ensureQueryData(options)` | Returns cached data at once, fresh or stale; fetches only when there is none | The default. Navigation shows what is cached, and the page refetches stale data behind it. |
| `fetchQuery(options)` | Returns fresh cached data; waits for a refetch when it is stale | A page that would mislead with stale data: a form seeded from the record. |
| `prefetchQuery(options)` | Starts a fetch and never throws | Secondary data. Don't `await` it. |

**Await what the page can't render without; start the rest.** Data for the main
content is awaited, so the page appears complete. Data for a side panel or a count
is started with `void queryClient.prefetchQuery(…)` and rendered under its own
`<Suspense>`, so a slow extra never holds up navigation.

`load` does three things at most: read params and search params, decide what this
navigation needs, and await it. It doesn't transform data, catch errors or check
the session.

## The page

```tsx
// src/routes/project/project.page.tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { DetailsToggle } from "./lib/details/details-toggle";
import { ProjectProvider } from "./project.provider";
import { projectTasksOptions } from "./project.queries";
import { useProjectSearch } from "./project.search";

export function ProjectPage({ params: { projectId } }: { params: { projectId: string } }) {
	const { order } = useProjectSearch();
	// The loader put it in the cache, so `tasks` is never undefined.
	const { data: tasks } = useSuspenseQuery(projectTasksOptions(projectId, order));
	return (
		<ProjectProvider projectId={projectId}>
			<title>{`Project ${projectId}`}</title>
			<h1>Tasks</h1>
			<DetailsToggle />
			<ul>
				{tasks.map((task) => (
					<li key={task.id}>{task.name}</li>
				))}
			</ul>
		</ProjectProvider>
	);
}
```

- **`useSuspenseQuery`, with the loader's options.** Because the loader warmed the
  cache, `data` is never `undefined` and the page has no loading branch. If a
  loader forgets something, the page suspends instead of crashing.
- **Errors reach the boundary only when there is nothing to show.** A background
  refetch that fails leaves the page as it is. A page that was fine a second ago
  should not be replaced by an error.
- **The title is a `<title>` element.** React hoists it into the document head,
  and it can be built from Query data.
- **The page composes.** It renders the screen's provider and its capabilities'
  connected components, passes ids rather than data, and holds no workflow.

## What lives in the URL

State belongs in the URL when Back, reload or a pasted link should restore it: the
record (in the path), and sort, filter, page, tab and an open preview (in search
params). Each route has one file that names, parses and writes its search params.

```ts
// src/routes/project/project.search.ts
import { useSearchParams } from "react-router";
import { z } from "zod";

// What this page keeps in the URL's search params: the one place they are
// named, parsed and written.

const defaults = { order: "name" } as const;

const schema = z.object({
	/** A filter: changing it replaces the history entry. */
	order: z.enum(["name", "due"]).catch(defaults.order),
	/** A place: the task open in the preview. Opening it adds a history entry. */
	task: z.string().min(1).optional().catch(undefined),
});

export type ProjectSearch = z.infer<typeof schema>;

/** Never throws: a value the page doesn't know becomes its default. */
export function parseProjectSearch(params: URLSearchParams): ProjectSearch {
	return schema.parse(Object.fromEntries(params));
}

/** The next params: a default or missing value leaves the URL, so links stay short. */
function write(params: URLSearchParams, changes: Partial<ProjectSearch>) {
	const next = new URLSearchParams(params);
	for (const [name, value] of Object.entries(changes)) {
		const isDefault = value === defaults[name as keyof typeof defaults];
		if (value === undefined || isDefault) next.delete(name);
		else next.set(name, value);
	}
	return next;
}

export function useProjectSearch() {
	const [params, setParams] = useSearchParams();
	return {
		...parseProjectSearch(params),
		setOrder: (order: ProjectSearch["order"]) =>
			setParams(write(params, { order }), { replace: true }),
		openTask: (task: string) => setParams(write(params, { task })),
		closeTask: () => setParams(write(params, { task: undefined })),
	};
}
```

- **Parsing never throws.** A value the page doesn't know becomes its default
  (`.catch`). A URL is user input and old links outlive the code that wrote them.
- **Defaults leave the URL.** `?order=name` is never written, so links stay short
  and changing a default later doesn't strand old links on the old one.
- **Filters replace, places push.** Changing sort or a filter replaces the history
  entry, so Back doesn't step through every adjustment. Opening a preview or a tab
  is going somewhere, so it adds an entry and Back closes it.
- **The loader and the page parse the same way**, with `parseProjectSearch`, so
  they can't disagree about what the URL means.
- **A setting can supply the default when the URL is silent.** Give the parser a
  fallback argument, and have both the loader and the hook pass the setting's
  current value. The resolved value goes in the query key, so changing the setting
  fetches the new order.
- **A text input backed by the URL keeps its own draft.** The input shows what was
  typed; the URL is written after a debounce; the draft follows the URL when it
  changes from elsewhere (Back). Writing the URL on every keystroke makes typing
  lag and floods history.

## The session guard

One guard on the shell route covers every signed-in page. A guard is middleware:
it runs before any loader at or beneath its route, in order, which a parent's
loader can't promise (loaders run in parallel).

```ts
// src/routes/app-shell/app-shell.route.ts
import { redirectDocument } from "react-router";
import { isUnauthorized } from "~/lib/api/api-error";
import { defineRoute } from "~/lib/router/define-route";
import { requireSession } from "~/lib/session/session";

/**
 * The layout around every signed-in page, and the one guard for all of them.
 * The guard runs before any loader beneath it, so no loader checks the session.
 */
export const appShellRoute = defineRoute({
	page: async () => (await import("./app-shell.layout")).AppShellLayout,
	guard: ({ queryClient }) =>
		async function signedIn({ request }) {
			try {
				await requireSession(queryClient);
			} catch (error) {
				if (!isUnauthorized(error)) throw error;
				const { pathname, search } = new URL(request.url);
				throw redirectDocument(
					`/sign-in?returnTo=${encodeURIComponent(pathname + search)}`,
				);
			}
		},
});
```

```tsx
// src/routes/app-shell/app-shell.layout.tsx
import { Outlet } from "react-router";
import { NavigationProgress } from "~/lib/app/navigation-progress";

/** What stays on screen through every signed-in page. */
export function AppShellLayout() {
	return (
		<>
			<NavigationProgress />
			<nav aria-label="Main">{/* Navigation. */}</nav>
			<main>
				<Outlet />
			</main>
		</>
	);
}
```

No loader checks the session or catches a 401. A session that ends between
navigations is handled once, by the Query client ([session](session.md)).

## Failures

`defineRoute` gives every route the same error boundary, and where a route sits in
the tree decides what stays on screen:

| The failure is in | Rendered by | Stays on screen |
| --- | --- | --- |
| A page or its loader | That route's boundary, inside its parent's `<Outlet />` | The shell and its navigation |
| The shell or its guard | The shell's boundary, inside the root | Nothing but the message |
| The root | The root's boundary | Nothing but the message |

```tsx
// src/lib/app/route-error.tsx
import { isRouteErrorResponse, Link } from "react-router";
import { ApiError, isForbidden, isNotFound, isOffline } from "~/lib/api/api-error";

export type ErrorKind = "not-found" | "forbidden" | "offline" | "unexpected";

/** What went wrong, in the user's terms. */
export function errorKind(error: unknown): ErrorKind {
	const status = isRouteErrorResponse(error) ? error.status : undefined;
	if (status === 404 || isNotFound(error)) return "not-found";
	if (status === 403 || isForbidden(error)) return "forbidden";
	if (isOffline(error)) return "offline";
	return "unexpected";
}

const messages: Record<ErrorKind, { title: string; body: string }> = {
	"not-found": { title: "Not found", body: "This page doesn't exist, or you can't open it." },
	forbidden: { title: "No access", body: "You don't have access to this page." },
	offline: { title: "You're offline", body: "Check your connection, then try again." },
	unexpected: { title: "Something went wrong", body: "Try again. If it keeps happening, tell us." },
};

/** One failure, said the same way wherever it happens. */
export function RouteErrorMessage({ kind }: { kind: ErrorKind }) {
	const { title, body } = messages[kind];
	return (
		<div role="alert">
			<h1>{title}</h1>
			<p>{body}</p>
			{kind === "offline" || kind === "unexpected" ? (
				<a href={window.location.href}>Try again</a>
			) : (
				<Link to="/">Go home</Link>
			)}
		</div>
	);
}

/** What every route's error boundary renders. */
export function RouteError({ error }: { error: unknown }) {
	const kind = errorKind(error);
	// An unexpected error is a bug: report it. `ApiError`s are already reported once.
	if (kind === "unexpected" && !(error instanceof ApiError)) console.error(error);
	return <RouteErrorMessage kind={kind} />;
}
```

A loader doesn't translate errors. A service call that fails throws an `ApiError`
through `ensureQueryData` to the boundary, and `errorKind` decides what to say. To
refuse a URL the server was never asked about, throw a response from `load`:
`throw data(null, { status: 404 })`.

## While a page loads

Navigation keeps the current page on screen until the next one's `load` finishes,
so there is no skeleton to design for navigation. One indicator in the shell says
the app is working:

```tsx
// src/lib/app/navigation-progress.tsx
import { useNavigation } from "react-router";

/**
 * The one sign that a page is loading. The page on screen stays until the
 * next one is ready, so there is nothing else to show. CSS delays it, so a
 * fast navigation shows nothing.
 */
export function NavigationProgress() {
	const { state } = useNavigation();
	if (state === "idle") return null;
	return <div aria-label="Loading page" className="navigation-progress" role="progressbar" />;
}
```

```css
.navigation-progress {
	/* Invisible for the first 150ms, so a fast navigation shows nothing. */
	animation: navigation-progress-appear 0s 150ms both;
}
@keyframes navigation-progress-appear {
	from { opacity: 0; }
	to { opacity: 1; }
}
```

- The root route's `fallback` is for the first load only, before any page exists.
  It is imported eagerly, so keep it free of dependencies.

  ```ts
  // src/routes/root/root.route.ts
  import { defineRoute } from "~/lib/router/define-route";
  import { RootFallback } from "./root.fallback";

  /** Wraps every page: focus and scroll on navigation, and the first-load fallback. */
  export const rootRoute = defineRoute({
  	page: async () => (await import("./root.layout")).RootLayout,
  	fallback: RootFallback,
  });
  ```

- `<Suspense>` fallbacks are for secondary data the loader started without
  awaiting.
- Don't add `shouldRevalidate` to save work. Loaders are cheap because they read
  the cache.

## Links

A link can warm the next page's data when the user shows intent, with the same
query options the route's `load` uses:

```tsx
<Link
	onFocus={() => void queryClient.prefetchQuery(projectTasksOptions(project.id, "name"))}
	onMouseEnter={() => void queryClient.prefetchQuery(projectTasksOptions(project.id, "name"))}
	to={`/projects/${project.id}`}
>
```

Do this for the few links where the wait is worth removing, not for every link.

## Focus and scroll after navigation

A single-page app doesn't announce a new page. When the path changes, focus moves
to the page's heading; search-param changes leave focus where it is.

```tsx
// src/lib/app/route-focus.tsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * A single-page app doesn't announce navigation. When the path changes, focus
 * moves to the new page's heading, so screen readers read it and the keyboard
 * continues from the top. Search-param changes and the first load leave focus
 * alone. Render it once, in the root.
 */
export function RouteFocus() {
	const { pathname } = useLocation();
	const previous = useRef(pathname);
	useEffect(() => {
		if (previous.current === pathname) return;
		previous.current = pathname;
		const target =
			document.querySelector<HTMLElement>("main h1") ??
			document.querySelector<HTMLElement>("main");
		if (!target) return;
		target.tabIndex = -1;
		target.focus({ preventScroll: true });
	}, [pathname]);
	return null;
}
```

The root layout renders it once, with the router's scroll restoration. Every page
has one `<h1>` inside `<main>`.

```tsx
// src/routes/root/root.layout.tsx
import { Outlet, ScrollRestoration } from "react-router";
import { RouteFocus } from "~/lib/app/route-focus";

export function RootLayout() {
	return (
		<>
			<RouteFocus />
			<ScrollRestoration />
			<Outlet />
		</>
	);
}
```

## Unsaved changes

One hook holds the user on a page with unsaved work. A form's feature hook calls
it with whether the draft differs from what was saved, and its view renders the
question.

```ts
// src/lib/app/use-unsaved-changes.ts
import { useCallback } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

/**
 * Holds the user on the page while `dirty`. A navigation inside the app waits
 * for `leave` or `stay`; closing or reloading the tab gets the browser's own
 * prompt.
 */
export function useUnsavedChanges(dirty: boolean) {
	const blocker = useBlocker(dirty);
	useBeforeUnload(
		useCallback(
			(event) => {
				if (dirty) event.preventDefault();
			},
			[dirty],
		),
	);
	return {
		/** A navigation is waiting: ask the user. */
		asking: blocker.state === "blocked",
		leave: () => blocker.proceed?.(),
		stay: () => blocker.reset?.(),
	};
}
```

## What the router is not used for

These are this reference's Query ownership choices, not restrictions imposed by
React Router. Other apps can use route data or actions as their chosen owner.

| Don't use | Because |
| --- | --- |
| Route `action`s, `useFetcher`, `useSubmit` for writes | Router revalidation knows nothing about the Query cache, so a second write path needs a second way to refresh data. Writes are mutations or command slices ([commands](state/commands.md)). |
| `useLoaderData` | A loader's return value is a second copy of server data that invalidation can't refresh. `load` returns nothing. |
| `useParams` in a page | The page receives typed `params` as a prop. Components further down receive ids from the page. |
| The URL hash for state | It isn't sent to loaders and doesn't parse with the rest. |
| Folder nesting to express URL nesting | The tree is in `routes.ts`, where it can be read in one place. |

## If the app uses framework mode

Use the [Framework routing guide](framework-routing.md) and the checked-in
[Framework example](../framework/README.md). Keep `defineRoute` here in Data Mode.
In Framework Mode:

- `routes.ts` registers every route with `route(path, moduleFile)` from
  `@react-router/dev/routes`. There is no per-route helper.
- The registered `.route.ts` exports native `clientLoader`, `clientMiddleware`,
  and boundary functions. Import the page, then `export default ProjectPage`;
  the re-export shorthand is not given route props.
- The `.page.tsx` imports `Route.ComponentProps` from `./+types/project.route`.
  Keep the route/page split for every route, as here.
- The Query client is a module-level instance, because native exports can't
  receive `RouteDeps`.

Query options, services, URL parsing, feature ownership, and route stores still
carry over. The Framework guide explains the differences and includes the source.
