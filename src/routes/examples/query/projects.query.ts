import { queryOptions } from "@tanstack/react-query";
import { projectsService } from "~/services";
import type { Scenario } from "./projects";

export function projectsQuery(scenario: Scenario) {
	return queryOptions({
		queryKey: ["demo-projects", scenario],
		queryFn: ({ signal }) => projectsService.list(scenario, { signal }),
		// Deliberate demo failures should surface immediately.
		retry: false,
	});
}
