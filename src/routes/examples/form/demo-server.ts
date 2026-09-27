import type { ProjectRequest } from "./project-request";

export type ServerScenario = "default" | "error";

export function parseServerScenario(search: URLSearchParams): ServerScenario {
	return search.get("scenario") === "error" ? "error" : "default";
}

let nextId = 1;

// Stands in for an API call. Nothing leaves the browser.
export async function submitProjectRequest(
	request: ProjectRequest,
	scenario: ServerScenario,
) {
	await new Promise((resolve) => setTimeout(resolve, 800));
	if (scenario === "error") {
		throw new Error("The demo server is unavailable.");
	}
	return { id: `REQ-${String(nextId++).padStart(3, "0")}`, ...request };
}
