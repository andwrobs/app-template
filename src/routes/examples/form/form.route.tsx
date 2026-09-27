import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { useAppForm } from "~/lib/form/app-form";
import { Button, LinkButton } from "~/lib/ui/button";
import { FieldGroup } from "~/lib/ui/field";
import { parseServerScenario, submitProjectRequest } from "./demo-server";
import {
	emptyProjectRequest,
	type ProjectRequest,
	projectRequestSchema,
	teams,
} from "./project-request";

export default function FormRoute() {
	const [searchParams] = useSearchParams();
	const scenario = parseServerScenario(searchParams);

	// The mutation owns the submission: pending, failure, and the saved result.
	const mutation = useMutation({
		mutationFn: (request: ProjectRequest) =>
			submitProjectRequest(request, scenario),
	});

	const form = useAppForm({
		defaultValues: emptyProjectRequest,
		validators: { onChange: projectRequestSchema },
		onSubmit: async ({ value, formApi }) => {
			await mutation.mutateAsync(projectRequestSchema.parse(value));
			formApi.reset();
		},
	});
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

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
			<nav aria-label="Server scenarios" className="flex flex-wrap gap-2">
				<LinkButton href="/examples/form" variant="outline">
					Working server
				</LinkButton>
				<LinkButton href="/examples/form?scenario=error" variant="outline">
					Failing server
				</LinkButton>
			</nav>
			<p className="text-sm text-muted-foreground">
				Submissions go to the{" "}
				<strong className="font-medium text-foreground">
					{scenario === "error" ? "failing" : "working"}
				</strong>{" "}
				server.
			</p>
			<form.AppForm>
				<form.Form className="max-w-xl space-y-6">
					<FieldGroup>
						<form.AppField name="name">
							{(field) => (
								<field.TextField
									label="Project name"
									isRequired
									autoComplete="off"
								/>
							)}
						</form.AppField>
						<form.AppField name="email">
							{(field) => (
								<field.TextField
									label="Contact email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									isRequired
								/>
							)}
						</form.AppField>
						<form.AppField name="team">
							{(field) => (
								<field.SelectField
									label="Team"
									placeholder="Choose a team"
									options={teams}
									isRequired
								/>
							)}
						</form.AppField>
						<form.AppField name="details">
							{(field) => (
								<field.TextareaField
									label="Project details"
									description="20 to 500 characters. Leading and trailing spaces are trimmed on submit."
									isRequired
								/>
							)}
						</form.AppField>
						<form.AppField name="confirm">
							{(field) => (
								<field.CheckboxField
									label="This request contains only sample data"
									isRequired
								/>
							)}
						</form.AppField>
					</FieldGroup>
					{mutation.isError && (
						<div
							role="alert"
							className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
						>
							<p className="font-medium text-destructive">
								{mutation.error.message}
							</p>
							<p>
								Your answers are still here. Switch to the working server and
								submit again.
							</p>
						</div>
					)}
					<div className="flex flex-wrap gap-2">
						<form.SubmitButton>Submit request</form.SubmitButton>
						<Button
							variant="outline"
							isDisabled={isSubmitting}
							onPress={() => {
								form.reset();
								mutation.reset();
							}}
						>
							Reset
						</Button>
					</div>
					<p role="status" className="text-sm">
						{mutation.isSuccess &&
							`Saved ${mutation.data.id}: “${mutation.data.name}” for ${mutation.data.team}.`}
					</p>
				</form.Form>
			</form.AppForm>
		</main>
	);
}
