import { queryOptions } from "@tanstack/react-query";
import { tasksService } from "~/services";

export const tasksQuery = queryOptions({
	queryKey: ["demo-tasks"],
	queryFn: ({ signal }) => tasksService.list({ signal }),
});
