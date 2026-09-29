import { Button, LinkButton } from "~/lib/ui/button";
import { FieldGroup } from "~/lib/ui/field";
import { teams } from "../../project-request";
import type { ProjectRequestFormProps } from "./useProjectRequestForm";

export function ProjectRequestFormView({
	form,
	scenario,
	isSubmitting,
	saved,
	error,
	resetRequest,
}: ProjectRequestFormProps) {
	return (
		<>
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
					{error && (
						<div
							role="alert"
							className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
						>
							<p className="font-medium text-destructive">{error}</p>
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
							onPress={resetRequest}
						>
							Reset
						</Button>
					</div>
					<p role="status" className="text-sm">
						{saved && `Saved ${saved.id}: “${saved.name}” for ${saved.team}.`}
					</p>
				</form.Form>
			</form.AppForm>
		</>
	);
}
