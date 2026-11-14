import { queryOptions } from "@tanstack/react-query";
import { getTasksService } from "~/services";

export const tasksQuery = queryOptions({
	queryKey: ["demo-tasks"],
	queryFn: ({ signal }) => getTasksService().list({ signal }),
});
