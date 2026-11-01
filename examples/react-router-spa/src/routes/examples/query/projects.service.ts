import type { ApiClient } from "~/lib/api/api";
import { type Project, projectsSchema, type Scenario } from "./projects";

export interface ProjectsService {
	list(
		scenario: Scenario,
		options?: { signal?: AbortSignal },
	): Promise<Project[]>;
}

type Deps = { api: ApiClient };

export function createProjectsService({ api }: Deps): ProjectsService {
	async function list(
		scenario: Scenario,
		{ signal }: { signal?: AbortSignal } = {},
	) {
		if (scenario === "error") {
			throw new Error(
				"This is the demonstration error. Return to the sample projects to recover.",
			);
		}
		const projects = await api.request("projects.json", projectsSchema, {
			signal,
		});
		return scenario === "empty" ? [] : projects;
	}

	return { list };
}
