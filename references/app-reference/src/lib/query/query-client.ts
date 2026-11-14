import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isTransient, isUnauthorized } from "~/lib/api/api-error";
import { sessionExpired } from "~/lib/session/sign-in-redirect";

// A 401 can arrive at any moment, not only while a page loads, so it is
// handled once, here. The session query is the exception: the shell's guard
// asks it on purpose and redirects itself.
function onError(error: unknown, key?: readonly unknown[]) {
	if (isUnauthorized(error) && key?.[0] !== "session") sessionExpired();
}

/**
 * Builds the app's Query client. `app.tsx` makes one and hands it to the
 * routes and the provider; each test makes its own.
 */
export function createQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => onError(error, query.queryKey),
		}),
		mutationCache: new MutationCache({ onError: (error) => onError(error) }),
		defaultOptions: {
			queries: {
				// Long enough that a loader and the page it feeds share one fetch.
				staleTime: 30_000,
				retry: (failures, error) => failures < 1 && isTransient(error),
			},
			// A write is retried by the user, under the same idempotency key.
			mutations: { retry: false },
		},
	});
}
