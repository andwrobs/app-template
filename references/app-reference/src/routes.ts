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
