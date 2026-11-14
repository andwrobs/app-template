import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/form.route";
import { ProjectRequestForm } from "./components/ProjectRequestForm";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Form example") },
];

export default function FormRoute() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Example 02 · TanStack Form + Aria fields
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Request a sample project.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					Errors appear after you leave a field or submit, then update as you
					type. A simulated server answers after a short delay; nothing leaves
					the browser.
				</p>
			</div>
			<ProjectRequestForm />
		</main>
	);
}
