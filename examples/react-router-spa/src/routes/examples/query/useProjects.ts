import { useQuery } from "@tanstack/react-query";
import type { Scenario } from "./projects";
import { projectsQuery } from "./projects.query";

// The scenario's projects and a refresh that takes no arguments. Bound to
// onPress directly, query.refetch would receive the PressEvent as its options.
export function useProjects(scenario: Scenario) {
	const query = useQuery(projectsQuery(scenario));
	return {
		projects: query.data,
		isFetching: query.isFetching,
		isError: query.isError,
		refresh: () => {
			void query.refetch();
		},
	};
}
