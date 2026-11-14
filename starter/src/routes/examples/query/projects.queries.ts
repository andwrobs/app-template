import { queryOptions } from "@tanstack/react-query";
import type { Scenario } from "~/lib/demo/projects";
import { getProjectsService } from "~/services";

export function projectsQuery(scenario: Scenario) {
	return queryOptions({
		queryKey: ["demo-projects", scenario],
		queryFn: ({ signal }) => getProjectsService().list(scenario, { signal }),
		// Deliberate demo failures should surface immediately.
		retry: false,
	});
}
