import type { ApiClient } from "~/lib/api/api-client";

export type Session = { viewerId: string; name: string };

export function createSessionService({ request }: ApiClient) {
	return {
		current: (signal?: AbortSignal) => request<Session>("/api/session", { signal }),
		signIn: (credentials: { email: string; password: string }) =>
			request<Session>("/api/session", {
				method: "POST",
				body: JSON.stringify(credentials),
			}),
		signOut: () => request<void>("/api/session", { method: "DELETE" }),
	};
}
