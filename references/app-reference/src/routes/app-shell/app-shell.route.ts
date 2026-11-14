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
