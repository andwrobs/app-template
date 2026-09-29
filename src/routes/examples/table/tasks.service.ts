import { z } from "zod";
import type { ApiClient } from "~/lib/api/api";
import { type Task, taskSchema } from "./tasks";

export interface TasksService {
	list(options?: { signal?: AbortSignal }): Promise<Task[]>;
}

type Deps = { api: ApiClient };

export function createTasksService({ api }: Deps): TasksService {
	async function list({ signal }: { signal?: AbortSignal } = {}) {
		return api.request("tasks.json", z.array(taskSchema), { signal });
	}

	return { list };
}
