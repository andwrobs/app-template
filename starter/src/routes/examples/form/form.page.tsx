import { ProjectRequestForm } from "./lib/project-request-form/project-request-form";

export function FormPage() {
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
