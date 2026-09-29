import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiUrl, createApiClient, fetchJson } from "./api";

const fetchMock = vi.fn();
const item = z.object({ id: z.string() });

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function failure(promise: Promise<unknown>) {
	const error = await promise.catch((caught: unknown) => caught);
	expect(error).toBeInstanceOf(ApiError);
	return error as ApiError;
}

it("parses JSON with the schema and sends JSON bodies", async () => {
	fetchMock.mockResolvedValue(Response.json({ id: "a", extra: true }));
	await expect(
		fetchJson("/demo/item.json", item, { method: "POST", json: { id: "a" } }),
	).resolves.toEqual({ id: "a" });
	const [url, init] = fetchMock.mock.calls[0] ?? [];
	expect(url).toBe("/demo/item.json");
	expect(init.body).toBe('{"id":"a"}');
	expect(init.headers.get("Content-Type")).toBe("application/json");
	expect(init.headers.get("Accept")).toBe("application/json");
});

it("tells network, HTTP, and invalid-response failures apart", async () => {
	fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
	expect((await failure(fetchJson("/x", item))).kind).toBe("network");

	fetchMock.mockResolvedValueOnce(
		Response.json({ message: "Nope" }, { status: 503 }),
	);
	const http = await failure(fetchJson("/x", item));
	expect([http.kind, http.status, http.body]).toEqual([
		"http",
		503,
		{ message: "Nope" },
	]);
	expect(http.message).toBe("Request failed (503).");

	fetchMock.mockResolvedValueOnce(Response.json({ name: "no id" }));
	expect((await failure(fetchJson("/x", item))).kind).toBe("invalid-response");

	fetchMock.mockResolvedValueOnce(new Response("<html>not json</html>"));
	expect((await failure(fetchJson("/x", item))).kind).toBe("invalid-response");
});

it("lets aborts through for Query to handle", async () => {
	fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
	const error = await fetchJson("/x", item).catch((caught) => caught);
	expect(error).not.toBeInstanceOf(ApiError);
	expect(error.name).toBe("AbortError");
});

it("resolves API paths against the configured base URL", async () => {
	expect(apiUrl("/tasks", "/api/")).toBe("/api/tasks");
	expect(apiUrl("tasks/1", "https://api.example.test/v1")).toBe(
		"https://api.example.test/v1/tasks/1",
	);
	fetchMock.mockResolvedValue(Response.json({ id: "1" }));
	const api = createApiClient({ baseUrl: "/api" });
	await expect(api.request("/tasks/1", item)).resolves.toEqual({ id: "1" });
	expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/tasks/1");
});
