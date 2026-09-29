import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { useAppForm } from "~/lib/form/app-form";
import { projectRequestService } from "~/services";
import {
	emptyProjectRequest,
	type ProjectRequest,
	parseServerScenario,
	projectRequestSchema,
} from "../../project-request";

// Owns the request workflow. TanStack Form owns values and validation; the
// mutation owns submission, its failure, and the saved result. A submit parses
// the values, saves them, then clears the form.
export function useProjectRequestForm() {
	const [searchParams] = useSearchParams();
	const scenario = parseServerScenario(searchParams);

	const mutation = useMutation({
		mutationFn: (request: ProjectRequest) =>
			projectRequestService.submit(request, scenario),
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

	return {
		// Field bindings for the view; it doesn't reset or submit through them.
		form,
		scenario,
		isSubmitting,
		saved: mutation.data,
		error: mutation.error?.message,
		// Clears the answers, their errors, and the last saved or failed request.
		resetRequest: () => {
			form.reset();
			mutation.reset();
		},
	};
}

export type ProjectRequestFormProps = ReturnType<typeof useProjectRequestForm>;
