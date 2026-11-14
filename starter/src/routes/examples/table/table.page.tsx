import { LinkButton } from "~/lib/ui/button";
import { TaskTable } from "./lib/task-table/task-table";

export function TablePage() {
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

export function TableErrorBoundary() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 sm:px-6">
			<h1 className="text-3xl font-semibold">Tasks could not load.</h1>
			<p role="alert">The sample tasks request failed. Try again.</p>
			<LinkButton href="/examples/table">Reload the tasks</LinkButton>
		</main>
	);
}
