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
