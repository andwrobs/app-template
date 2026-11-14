import { useQuery } from "@tanstack/react-query";
import type { Scenario } from "~/lib/demo/projects";
import { projectsQuery } from "../projects.queries";

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
