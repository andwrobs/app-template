import { TaskTableView } from "./TaskTableView";
import { useTaskTable } from "./useTaskTable";

export function TaskTable() {
	const props = useTaskTable();
	return <TaskTableView {...props} />;
}
