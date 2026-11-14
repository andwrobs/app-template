import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../test-utils/render-route";
import { stubApi } from "../test-utils/stub-api";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test("the shell's guard loads the session before any page under it loads", async () => {
	const { requests } = stubApi({
		"GET /api/session": { viewerId: "v1", name: "Ada" },
		"GET /api/projects/p1/tasks": [{ id: "t1", name: "Write the brief", starred: false }],
	});

	renderApp("/projects/p1");

	expect(await screen.findByText("Write the brief")).toBeDefined();
	expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
		"/api/session",
		"/api/projects/p1/tasks",
	]);
});

test("a URL no route matches shows Not found", async () => {
	stubApi({});

	renderApp("/nowhere");

	expect(await screen.findByRole("heading", { name: "Not found" })).toBeDefined();
});
