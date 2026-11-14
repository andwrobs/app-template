import { redirectDocument } from "react-router";
import { isUnauthorized } from "~/lib/api/api-error";
import { requireSession } from "~/lib/session/session";
import { AppShellLayout } from "~/routes/app-shell/app-shell.layout";
import { queryClient } from "../../lib/query-client.client";
import type { Route } from "./+types/app-shell.route";

export default AppShellLayout;

// Native client middleware awaits the session before invoking child loaders.
// Keep the catch around the session request, not around next(): a child failure
// should reach the route error boundary rather than become a sign-in redirect.
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
	async ({ request }, next) => {
		try {
			await requireSession(queryClient);
		} catch (error) {
			if (!isUnauthorized(error)) throw error;
			const { pathname, search } = new URL(request.url);
			throw redirectDocument(`/sign-in?returnTo=${encodeURIComponent(pathname + search)}`);
		}
		await next();
	},
];
