import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderRoute } from "../../../test-utils/render-route";
import { stubApi } from "../../../test-utils/stub-api";
import { projectRoute } from "./project.route";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test("shows the project's tasks in the order the URL asks for", async () => {
	const { requests } = stubApi({
		"GET /api/projects/p1/tasks": [{ id: "t1", name: "Write the brief", starred: false }],
	});

	renderRoute(projectRoute, "/projects/p1?order=due");

	expect(await screen.findByText("Write the brief")).toBeDefined();
	expect(new URL(requests[0]?.url ?? "").searchParams.get("order")).toBe("due");
});

test("a project the server doesn't have shows Not found", async () => {
	stubApi({ "GET /api/projects/nope/tasks": new Response(null, { status: 404 }) });

	renderRoute(projectRoute, "/projects/nope");

	expect(await screen.findByRole("heading", { name: "Not found" })).toBeDefined();
});
