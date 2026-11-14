import type { ShouldRevalidateFunctionArgs } from "react-router";
import { pageTitle } from "~/lib/meta/title";
import { queryClient } from "~/lib/query/client";
import type { Route } from "./+types/table.route";
import { TableErrorBoundary, TablePage } from "./table.page";
import { tasksQuery } from "./tasks.queries";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Table example") },
];

export async function clientLoader() {
	await queryClient.fetchQuery(tasksQuery);
	return null;
}

// The view lives in the search params and the fixture doesn't depend on them,
// so a search-only change skips the loader.
export function shouldRevalidate({
	currentUrl,
	nextUrl,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
	if (
		currentUrl.pathname === nextUrl.pathname &&
		currentUrl.search !== nextUrl.search
	) {
		return false;
	}
	return defaultShouldRevalidate;
}

export const ErrorBoundary = TableErrorBoundary;

export default TablePage;
