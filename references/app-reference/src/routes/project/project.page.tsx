import { useSuspenseQuery } from "@tanstack/react-query";
import { DetailsToggle } from "./lib/details/details-toggle";
import { ProjectProvider } from "./project.provider";
import { projectTasksOptions } from "./project.queries";
import { useProjectSearch } from "./project.search";

export function ProjectPage({ params: { projectId } }: { params: { projectId: string } }) {
	const { order } = useProjectSearch();
	// The loader put it in the cache, so `tasks` is never undefined.
	const { data: tasks } = useSuspenseQuery(projectTasksOptions(projectId, order));
	return (
		<ProjectProvider projectId={projectId}>
			<title>{`Project ${projectId}`}</title>
			<h1>Tasks</h1>
			<DetailsToggle />
			<ul>
				{tasks.map((task) => (
					<li key={task.id}>{task.name}</li>
				))}
			</ul>
		</ProjectProvider>
	);
}
