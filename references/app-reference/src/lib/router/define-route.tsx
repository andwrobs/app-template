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
