import type { ApiClient } from "~/lib/api/api-client";

export type Task = { id: string; name: string; starred: boolean };
export type TaskOrder = "name" | "due";

/** Stateless: every function is one API call. Knows nothing about Query or stores. */
export function createTaskService({ request }: ApiClient) {
	return {
		list: (projectId: string, order: TaskOrder, signal?: AbortSignal) =>
			request<Task[]>(`/api/projects/${projectId}/tasks?order=${order}`, { signal }),
		rename: (input: { taskId: string; name: string }) =>
			request<Task>(`/api/tasks/${input.taskId}`, {
				method: "PATCH",
				body: JSON.stringify({ name: input.name }),
			}),
		star: (input: { taskId: string; starred: boolean }) =>
			request<Task>(`/api/tasks/${input.taskId}`, {
				method: "PATCH",
				body: JSON.stringify({ starred: input.starred }),
			}),
		archive: (intent: { key: string; taskIds: readonly string[] }) =>
			request<{ archived: string[] }>("/api/tasks/archive", {
				method: "POST",
				headers: { "Idempotency-Key": intent.key },
				body: JSON.stringify({ taskIds: intent.taskIds }),
			}),
	};
}

export type TaskService = ReturnType<typeof createTaskService>;
