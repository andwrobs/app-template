import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getTaskService } from "~/services";
import { taskKeys } from "./tasks.queries";
import type { Task, TaskOrder } from "./tasks.service";

/** Renames a task, then refreshes every list and detail in its project. */
export function useRenameTask(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: getTaskService().rename,
		// Whatever happened, show what the server holds.
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}

/**
 * Stars a task and shows it at once. Optimistic because it is one field, the
 * server rarely refuses, and putting it back is exact.
 */
export function useStarTask(projectId: string, order: TaskOrder) {
	const queryClient = useQueryClient();
	const key = taskKeys.list(projectId, order);
	return useMutation({
		mutationFn: getTaskService().star,
		async onMutate({ taskId, starred }) {
			// A refetch already in flight would overwrite the optimistic value.
			await queryClient.cancelQueries({ queryKey: key });
			const before = queryClient.getQueryData<Task[]>(key);
			queryClient.setQueryData<Task[]>(key, (tasks) =>
				tasks?.map((task) => (task.id === taskId ? { ...task, starred } : task)),
			);
			return { before };
		},
		onError: (_error, _input, context) => {
			queryClient.setQueryData(key, context?.before);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}
