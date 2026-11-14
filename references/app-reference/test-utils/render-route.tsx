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
