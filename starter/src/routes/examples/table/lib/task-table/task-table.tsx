import { TaskTableView } from "./task-table-view";
import { useTaskTable } from "./use-task-table";

export function TaskTable() {
	const props = useTaskTable();
	return <TaskTableView {...props} />;
}
