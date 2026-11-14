import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { classifyFailure } from "~/lib/api/api-error";
import { useRenameTask } from "~/lib/tasks/tasks.mutations";
import type { Task } from "~/lib/tasks/tasks.service";

const schema = z.object({ name: z.string().trim().min(1, "Give the task a name.") });

/**
 * The rename form. The form owns the draft and its validation; the mutation
 * owns the request; this hook is the only place they meet.
 */
export function useRenameForm(projectId: string, task: Task, onRenamed: () => void) {
	const rename = useRenameTask(projectId);
	const form = useForm({
		defaultValues: { name: task.name },
		validators: { onSubmit: schema },
		async onSubmit({ value }) {
			// A failure stays in `rename.error`; the draft is kept so the user can retry.
			await rename.mutateAsync({ taskId: task.id, name: value.name.trim() });
			onRenamed();
		},
	});
	return {
		form,
		saving: rename.isPending,
		/** What to say about the last attempt, if it didn't work. */
		failure: rename.error ? classifyFailure(rename.error) : null,
	};
}
