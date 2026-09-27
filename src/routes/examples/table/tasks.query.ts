import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export const taskStatuses = {
	todo: "To do",
	"in-progress": "In progress",
	done: "Done",
	canceled: "Canceled",
} as const;

const taskSchema = z.object({
	id: z.string(),
	title: z.string(),
	status: z.enum(["todo", "in-progress", "done", "canceled"]),
	priority: z.enum(["low", "medium", "high"]),
	estimate: z.number().int().positive(),
	updated: z.iso.date(),
});

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = Task["status"];

export const tasksQuery = queryOptions({
	queryKey: ["demo-tasks"],
	queryFn: async ({ signal }) => {
		const response = await fetch("/demo/tasks.json", { signal });
		if (!response.ok) {
			throw new Error(`Tasks request failed (${response.status}).`);
		}
		return z.array(taskSchema).parse(await response.json());
	},
});
