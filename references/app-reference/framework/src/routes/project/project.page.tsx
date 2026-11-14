import type { Route } from "./+types/project.route";
import { ProjectView } from "./project-view.client";

// Types come from the registered route module, even though its component lives
// in another file. params.projectId is string, inferred from the path in routes.ts.
export function ProjectPage({ params }: Route.ComponentProps) {
	return <ProjectView params={params} />;
}
