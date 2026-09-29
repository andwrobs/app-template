import { z } from "zod";

export const taskStatuses = {
	todo: "To do",
	"in-progress": "In progress",
	done: "Done",
	canceled: "Canceled",
} as const;

export const taskSchema = z.object({
	id: z.string(),
	title: z.string(),
	status: z.enum(["todo", "in-progress", "done", "canceled"]),
	priority: z.enum(["low", "medium", "high"]),
	estimate: z.number().int().positive(),
	updated: z.iso.date(),
});

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = Task["status"];
