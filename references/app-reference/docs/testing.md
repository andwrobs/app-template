# Testing

What to test at each level, and the two utilities that make route tests run the
real app.

Part of the [app reference](README.md). The route utilities below exercise the
Data Mode app under `src/`; Framework Mode needs the additional checks described
below.

## Test where the rule lives

| Level | Tests | Cost | How many |
| --- | --- | --- | --- |
| Transitions and other pure functions | The rules: every branch of a state change, a parser, a classifier | Trivial | Most of the suite |
| Stores | That actions apply transitions, call ports and wire slices together | Low | Some per store |
| Routes, rendered | That the page loads, shows data, and a user can complete a flow | Moderate | A few per route |
| End to end | That the built app and a real server work together | High | One journey |

The architecture exists to push rules down this table. A rule in a pure
transition takes a three-line test. The same rule in a JSX handler needs a
rendered page, a stubbed server and a simulated click.

## Transitions

Call the function; assert what it returns.

```ts
// src/routes/project/lib/archive/archive-flow.test.ts
import { expect, test } from "vitest";
import {
	type ArchiveState,
	confirmArchive,
	finishArchive,
	initialArchive,
	startArchive,
} from "./archive-flow";

const uncertain: ArchiveState = {
	...initialArchive,
	open: true,
	taskIds: ["a"],
	request: { status: "uncertain", intent: { key: "k1", taskIds: ["a"] } },
};

test("a retry repeats the same request under the same key", () => {
	expect(confirmArchive(uncertain, "k2")?.send).toEqual({ key: "k1", taskIds: ["a"] });
});

test("nothing starts while a request is being sent", () => {
	const sending = confirmArchive(uncertain, "k2")?.next ?? uncertain;
	expect(startArchive(sending, ["b"])).toBeUndefined();
});

test("a reply that is no longer awaited changes nothing on screen", () => {
	const finished = finishArchive(
		initialArchive,
		{ key: "k1", taskIds: ["a"] },
		{ status: "done", archived: ["a"] },
	);
	expect(finished.next).toBeUndefined();
	// The tasks are gone either way, so the selection still hears about it.
	expect(finished.archived).toEqual(["a"]);
});
```

## Stores

Build a store with plain functions for ports, drive its actions, and assert state
and what the ports received. Each test builds its own store, so nothing is shared
and nothing is reset.

```ts
// src/routes/project/project.store.test.ts
import { expect, test, vi } from "vitest";
import type { SettledArchive } from "./lib/archive/archive-flow";
import { createProjectStore, type ProjectDeps } from "./project.store";

function build(overrides: Partial<ProjectDeps> = {}) {
	let open = false;
	const deps: ProjectDeps = {
		newKey: () => "key-1",
		sendArchive: vi.fn(async (): Promise<SettledArchive> => ({ status: "uncertain" })),
		dockedOpen: { get: () => open, set: (next) => void (open = next) },
		layout: { docked: () => true, onDockedChange: () => () => {} },
		...overrides,
	};
	return { store: createProjectStore(deps), deps };
}

test("a retry sends the same key, and archived tasks leave the selection", async () => {
	const sendArchive = vi
		.fn<ProjectDeps["sendArchive"]>()
		.mockResolvedValueOnce({ status: "uncertain" })
		.mockResolvedValueOnce({ status: "done", archived: ["a"] });
	const { store } = build({ sendArchive });
	const { selection, archive } = store.getState().actions;

	selection.replace(["a", "b"]);
	archive.start(["a"]);
	archive.confirm();
	await vi.waitFor(() =>
		expect(store.getState().archive.request.status).toBe("uncertain"),
	);
	archive.confirm();
	await vi.waitFor(() => expect(store.getState().archive.open).toBe(false));

	expect(sendArchive.mock.calls.map(([intent]) => intent.key)).toEqual(["key-1", "key-1"]);
	expect([...store.getState().selection.ids]).toEqual(["b"]);
});
```

An app-lifetime store is shared, so its tests reset it first:
`useNoticeStore.setState(initialState)`.

## Data Mode routes

A route test renders a route through the router and answers its requests at the
network boundary. Everything between runs for real: `load`, the Query client,
services, stores, hooks and components. It takes the same `projectRoute` the app
uses, so there is nothing to keep in step.

```ts
// test-utils/stub-api.ts
import { vi } from "vitest";

type Reply = unknown | ((request: Request) => unknown | Promise<unknown>);

/**
 * Answers the app's requests at the network boundary, so a test runs the real
 * services, queries, stores and components. Keys are "METHOD /path". A
 * `Response` is sent as it is; anything else is sent as JSON. A request with
 * no reply fails the test.
 */
export function stubApi(replies: Record<string, Reply>) {
	const requests: Request[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const request = new Request(new URL(String(input), "http://app.test"), init);
			requests.push(request.clone());
			const key = `${request.method} ${new URL(request.url).pathname}`;
			if (!(key in replies)) throw new Error(`No reply stubbed for ${key}`);
			const reply = replies[key];
			const value = typeof reply === "function" ? await reply(request) : reply;
			return value instanceof Response ? value : Response.json(value);
		}),
	);
	return { requests };
}
```

```tsx
// test-utils/render-route.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createQueryClient } from "~/lib/query/query-client";
import type { RouteDeps, RouteFactory } from "~/lib/router/define-route";
import { createRoutes } from "~/routes";

function renderRoutes(routes: (deps: RouteDeps) => RouteObject[], url: string) {
	// Each call gets its own Query client, so tests never share data.
	const queryClient = createQueryClient();
	const router = createMemoryRouter(routes({ queryClient }), { initialEntries: [url] });
	return render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
}

/**
 * Renders one route the way the app does: through the router, so its loader,
 * params, search params and error boundary all run. It skips the shell, so
 * there is no session to stub.
 */
export function renderRoute(route: RouteFactory, url: string) {
	return renderRoutes((deps) => [route(deps)], url);
}

/** Renders the whole route tree at `url`: the root, the shell and its guard included. */
export function renderApp(url: string) {
	return renderRoutes(createRoutes, url);
}
```

```tsx
// src/routes/project/project.route.test.tsx
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderRoute } from "../../../test-utils/render-route";
import { stubApi } from "../../../test-utils/stub-api";
import { projectRoute } from "./project.route";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test("shows the project's tasks in the order the URL asks for", async () => {
	const { requests } = stubApi({
		"GET /api/projects/p1/tasks": [{ id: "t1", name: "Write the brief", starred: false }],
	});

	renderRoute(projectRoute, "/projects/p1?order=due");

	expect(await screen.findByText("Write the brief")).toBeDefined();
	expect(new URL(requests[0]?.url ?? "").searchParams.get("order")).toBe("due");
});

test("a project the server doesn't have shows Not found", async () => {
	stubApi({ "GET /api/projects/nope/tasks": new Response(null, { status: 404 }) });

	renderRoute(projectRoute, "/projects/nope");

	expect(await screen.findByRole("heading", { name: "Not found" })).toBeDefined();
});
```

- **Stub `fetch`, nothing closer.** Mocking a hook, a store or a query replaces
  the code under test with the test's guess about it. Stubbing the network keeps
  every layer honest, and a wrong URL or a missing invalidation fails the test.
- **A request with no reply fails the test.** That catches a request the change
  wasn't supposed to make.
- **Assert what the user sees and what was sent**, by role and text. Not hook
  results, not store internals, not exact wording that copy edits would break.
- **Use `user-event` for interaction**, so focus, keyboard and pointer behave as
  they do in a browser.
- **Each render gets its own Query client**, so tests never share data.
- **`renderRoute` skips the shell**, so a page test stubs no session. `renderApp`
  renders the whole tree when the guard or the layout is what's under test:

```tsx
// src/routes.test.tsx
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../test-utils/render-route";
import { stubApi } from "../test-utils/stub-api";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test("the shell's guard loads the session before any page under it loads", async () => {
	const { requests } = stubApi({
		"GET /api/session": { viewerId: "v1", name: "Ada" },
		"GET /api/projects/p1/tasks": [{ id: "t1", name: "Write the brief", starred: false }],
	});

	renderApp("/projects/p1");

	expect(await screen.findByText("Write the brief")).toBeDefined();
	expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
		"/api/session",
		"/api/projects/p1/tasks",
	]);
});

test("a URL no route matches shows Not found", async () => {
	stubApi({});

	renderApp("/nowhere");

	expect(await screen.findByRole("heading", { name: "Not found" })).toBeDefined();
});
```

## Framework Mode routes

`renderRoute` above takes this reference's `RouteFactory`; it cannot take a
Framework `RouteConfigEntry`. A `routes.ts` entry names a module file for the framework
to load and is not a runtime `RouteObject`.

- Run `react-router typegen` before the TypeScript check so the page's
  `Route.ComponentProps` and the loader arguments resolve. Check the project
  through its framework build as well.
- Test pure query options, parsers, stores and page views at their existing
  boundaries. Passing props directly to a page is useful for its rendering
  behavior, but does not exercise the route compiler's props integration.
- Use the running or built Framework app for route integration checks: open a
  deep link, navigate between routes, and confirm generated params reach a
  separate page through the registered default export. Exercise a failed
  `clientLoader` and its boundary, plus initial loading behavior.
- The provider and `clientLoader` share one module-level Query client, so tests
  share it too: clear it after each test. If adding server rendering, cover cache hydration and isolation
  between requests.

The [Framework Mode example](../framework/README.md) supplies its own commands;
see [Framework Mode routing](framework-routing.md) for the export and type flow.

## Time

Control time for anything debounced, throttled or delayed. Fake only the app's
timers (`setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `Date`) so
React's own scheduling keeps running. Assert behavior (the stale search never
won), not timer calls.

## What a rendered check covers

Tests don't see layout. Before calling UI work done, look at it at a desktop and a
phone size, and check:

- a deep link loads directly, and reload keeps the page;
- Back and Forward restore what the URL holds;
- the keyboard reaches and operates everything, and focus goes somewhere sensible
  after each dialog, navigation and deletion;
- loading, empty, error, offline and disabled states;
- a failed and an uncertain write, and trying again.

## What not to test

Generated types, a library's behavior, exact copy, and implementation details
(which hook was called, how many renders). A test should fail only when behavior a
user or another module depends on has changed.
