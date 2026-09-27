import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { queryClient } from "~/lib/query/client";
import type { Route } from "./+types/query.route";
import { projectsQuery } from "./projects.query";
import QueryRoute, { clientLoader, meta } from "./query.route";

const projects = [
	{ id: "studio", name: "Sample design studio", status: "Active" },
];
const fetchMock = vi.fn();

function load(suffix = "") {
	return clientLoader({
		request: new Request(`https://example.test/examples/query${suffix}`),
	} as Route.ClientLoaderArgs);
}

beforeEach(() => {
	queryClient.clear();
	fetchMock.mockReset().mockImplementation(async () => Response.json(projects));
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	queryClient.clear();
	vi.unstubAllGlobals();
});

it("shares a fresh loader cache with the screen and a return navigation", async () => {
	const loaderData = await load();
	const router = createMemoryRouter([
		{
			path: "/",
			element: <QueryRoute {...({ loaderData } as Route.ComponentProps)} />,
		},
	]);
	render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	expect(screen.getByText("Sample design studio")).toBeInTheDocument();
	await load();
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("deduplicates simultaneous loads and reloads invalidated data", async () => {
	await Promise.all([load(), load()]);
	expect(fetchMock).toHaveBeenCalledTimes(1);
	await queryClient.invalidateQueries({ queryKey: ["demo-projects"] });
	await load();
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("isolates URL scenarios in the cache", async () => {
	await load();
	await load("?scenario=empty");
	expect(queryClient.getQueryData(projectsQuery("default").queryKey)).toEqual(
		projects,
	);
	expect(queryClient.getQueryData(projectsQuery("empty").queryKey)).toEqual([]);
	await expect(load("?scenario=error")).rejects.toThrow("demonstration error");
	expect(await load("?scenario=unknown")).toEqual({ scenario: "default" });
});

it("rejects HTTP failures and malformed data before rendering, then permits recovery", async () => {
	fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
	await expect(load()).rejects.toThrow("503");
	fetchMock.mockResolvedValueOnce(
		Response.json([{ name: "Missing identity" }]),
	);
	await expect(load()).rejects.toThrow();
	await load();
	expect(queryClient.getQueryData(projectsQuery("default").queryKey)).toEqual(
		projects,
	);
});

it("passes query cancellation to the transport", async () => {
	let transportSignal: AbortSignal | undefined;
	fetchMock.mockImplementation((_url, options) => {
		transportSignal = options.signal;
		return new Promise((_resolve, reject) => {
			transportSignal?.addEventListener("abort", () =>
				reject(new DOMException("Aborted", "AbortError")),
			);
		});
	});
	const result = load();
	const rejected = expect(result).rejects.toThrow();
	await queryClient.cancelQueries({ queryKey: ["demo-projects"] });
	await rejected;
	expect(transportSignal?.aborted).toBe(true);
});

it("titles the page", () => {
	expect(meta({} as Route.MetaArgs)).toEqual([
		{ title: "Query + Router example · React Router SPA" },
	]);
});
