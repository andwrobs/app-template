import { parseScenario } from "~/lib/demo/projects";
import { pageTitle } from "~/lib/meta/title";
import { queryClient } from "~/lib/query/client";
import type { Route } from "./+types/query.route";
import { projectsQuery } from "./projects.queries";
import { QueryErrorBoundary, QueryPage } from "./query.page";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Query + Router example") },
];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const scenario = parseScenario(request.url);
	// fetchQuery reuses fresh data, but waits for stale data. Query owns caching;
	// the router owns when navigation can complete and where errors appear.
	await queryClient.fetchQuery(projectsQuery(scenario));
	return { scenario };
}

export const ErrorBoundary = QueryErrorBoundary;

export default QueryPage;
