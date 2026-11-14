import type { TaskOrder } from "./tasks.service";

/**
 * Every key for tasks, from broad to narrow. Invalidating a key refreshes
 * everything under it, so a write names the broadest key it could have changed.
 * Shared here because more than one route reads tasks.
 */
export const taskKeys = {
	all: ["tasks"] as const,
	project: (projectId: string) => [...taskKeys.all, projectId] as const,
	list: (projectId: string, order: TaskOrder) =>
		[...taskKeys.project(projectId), "list", order] as const,
};
