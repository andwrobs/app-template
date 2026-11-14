import { queryOptions } from "@tanstack/react-query";
import { taskKeys } from "~/lib/tasks/tasks.queries";
import type { TaskOrder } from "~/lib/tasks/tasks.service";
import { taskService } from "~/services";

/** The project's tasks. The loader and the page both use it, so they share one cache entry. */
export function projectTasksOptions(projectId: string, order: TaskOrder) {
	return queryOptions({
		queryKey: taskKeys.list(projectId, order),
		queryFn: ({ signal }) => taskService.list(projectId, order, signal),
	});
}
