import { RouterContextProvider } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import { ApiError } from "~/lib/api/api-error";
import { projectTasksOptions } from "~/routes/project/project.queries";
import { stubApi } from "../../../test-utils/stub-api";
import { queryClient } from "../lib/query-client.client";
import { clientMiddleware } from "./app-shell/app-shell.route";
import { clientLoader } from "./project/project.route";

// The handler tests run in Node; the shared view deliberately uses browser-only
// stores. Its rendering and generated props are checked by the Framework build.
vi.mock("./project/project-view.client", () => ({ ProjectView: () => null }));

// Importing the registered module above is not enough to render its Page:
// component-prop injection belongs to the Framework build, checked separately.
function requestArgs(url = "http://app.test/projects/p1?order=due") {
	return {
		request: new Request(url),
		url: new URL(url),
		pattern: "/projects/:projectId",
		params: { projectId: "p1" },
		context: new RouterContextProvider(),
		serverLoader: async (): Promise<never> => {
			throw new Error("SPA routes have no server loader");
		},
	};
}

afterEach(() => {
	queryClient.clear();
	vi.unstubAllGlobals();
});

test("the native guard finishes before the client loader and warms the page's cache", async () => {
	const tasks = [{ id: "t1", name: "Write the brief", starred: false }];
	const { requests } = stubApi({
		"GET /api/session": { viewerId: "v1", name: "Ada" },
		"GET /api/projects/p1/tasks": tasks,
	});
	const args = requestArgs();

	await clientMiddleware[0](args, async () => {
		await clientLoader(args);
		return {};
	});
	const data = await queryClient.ensureQueryData(projectTasksOptions("p1", "due"));

	expect(data).toEqual(tasks);
	expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
		"/api/session",
		"/api/projects/p1/tasks",
	]);
	expect(new URL(requests[1].url).searchParams.get("order")).toBe("due");
});

test("an expired session redirects before the project loader can run", async () => {
	const { requests } = stubApi({
		"GET /api/session": new Response(null, { status: 401 }),
	});
	const next = vi.fn(async () => ({}));
	const response = await Promise.resolve(clientMiddleware[0](requestArgs(), next)).catch(
		(error: unknown) => error,
	);

	expect(response).toBeInstanceOf(Response);
	if (!(response instanceof Response)) throw new Error("Expected a redirect response");
	expect(response.status).toBe(302);
	expect(response.headers.get("Location")).toBe(
		"/sign-in?returnTo=%2Fprojects%2Fp1%3Forder%3Ddue",
	);
	expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
	expect(next).not.toHaveBeenCalled();
	expect(requests).toHaveLength(1);
});

test("a page error remains a page error rather than becoming a session redirect", async () => {
	stubApi({ "GET /api/session": { viewerId: "v1", name: "Ada" } });
	const error = new ApiError("http", 403);

	await expect(
		clientMiddleware[0](requestArgs(), async () => {
			throw error;
		}),
	).rejects.toBe(error);
});
