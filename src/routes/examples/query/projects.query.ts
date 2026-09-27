import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson } from "~/lib/api/api";

const projectsSchema = z.array(
	z.object({ id: z.string(), name: z.string(), status: z.string() }),
);

export type Scenario = "default" | "empty" | "error";

export function parseScenario(url: string): Scenario {
	const scenario = new URL(url).searchParams.get("scenario");
	return scenario === "empty" || scenario === "error" ? scenario : "default";
}

export function projectsQuery(scenario: Scenario) {
	return queryOptions({
		queryKey: ["demo-projects", scenario],
		queryFn: async ({ signal }) => {
			if (scenario === "error") {
				throw new Error(
					"This is the demonstration error. Return to the sample projects to recover.",
				);
			}
			const projects = await fetchJson("/demo/projects.json", projectsSchema, {
				signal,
			});
			return scenario === "empty" ? [] : projects;
		},
		// Deliberate demo failures should surface immediately.
		retry: false,
	});
}
