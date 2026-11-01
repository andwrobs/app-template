import type { ProjectRequest, ServerScenario } from "./project-request";

export interface ProjectRequestService {
	submit(
		request: ProjectRequest,
		scenario: ServerScenario,
	): Promise<ProjectRequest & { id: string }>;
}

// Stands in for an API call. Nothing leaves the browser.
export function createDemoProjectRequestService(): ProjectRequestService {
	async function submit(request: ProjectRequest, scenario: ServerScenario) {
		await new Promise((resolve) => setTimeout(resolve, 800));
		if (scenario === "error") {
			throw new Error("The demo server is unavailable.");
		}
		const id = crypto.randomUUID().slice(0, 6).toUpperCase();
		return { id: `REQ-${id}`, ...request };
	}

	return { submit };
}
