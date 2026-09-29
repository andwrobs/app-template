import type { ShouldRevalidateFunctionArgs } from "react-router";
import { pageTitle } from "~/lib/meta/title";
import { queryClient } from "~/lib/query/client";
import { LinkButton } from "~/lib/ui/button";
import type { Route } from "./+types/table.route";
import { TaskTable } from "./components/TaskTable";
import { tasksQuery } from "./tasks.query";

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

export default function TableRoute() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Example 03 · TanStack Table + Aria table
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Sort, filter, and select sample tasks.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					Search, status, sort, and page live in the URL, so reload, Back, and
					shared links keep the view. Selection and visible columns stay on this
					page.
				</p>
			</div>
			<TaskTable />
		</main>
	);
}

export function ErrorBoundary() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 sm:px-6">
			<h1 className="text-3xl font-semibold">Tasks could not load.</h1>
			<p role="alert">The sample tasks request failed. Try again.</p>
			<LinkButton href="/examples/table">Reload the tasks</LinkButton>
		</main>
	);
}
