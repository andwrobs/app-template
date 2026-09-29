import type { ApiClient } from "~/lib/api/api";
import {
	searchLatency,
	type TaskResult,
	taskResultsSchema,
} from "./task-search";

export interface TaskSearchService {
	search(
		term: string,
		options?: { signal?: AbortSignal },
	): Promise<TaskResult[]>;
}

type Deps = { api: ApiClient };

// Stands in for a search API: it filters the fixture after a delay.
export function createTaskSearchService({ api }: Deps): TaskSearchService {
	function wait(ms: number, signal?: AbortSignal) {
		return new Promise<void>((resolve, reject) => {
			const id = setTimeout(resolve, ms);
			signal?.addEventListener(
				"abort",
				() => {
					clearTimeout(id);
					reject(signal.reason);
				},
				{ once: true },
			);
		});
	}

	async function search(
		term: string,
		{ signal }: { signal?: AbortSignal } = {},
	) {
		await wait(searchLatency(term), signal);
		const tasks = await api.request("tasks.json", taskResultsSchema, {
			signal,
		});
		const needle = term.toLowerCase();
		return tasks.filter((task) => task.title.toLowerCase().includes(needle));
	}

	return { search };
}
