import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson } from "~/lib/api/api";

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
	queryFn: ({ signal }) =>
		fetchJson("/demo/tasks.json", z.array(taskSchema), { signal }),
});
