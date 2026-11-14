import { projectTasksOptions } from "~/routes/project/project.queries";
import { parseProjectSearch } from "~/routes/project/project.search";
import { queryClient } from "../../lib/query-client.client";
import type { Route } from "./+types/project.route";
import { ProjectPage } from "./project.page";

// Import, then `export default`: the compiler adds route props only to a default
// export declaration. `export { ProjectPage as default } from …` gets none.
export default ProjectPage;

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
	const { order } = parseProjectSearch(new URL(request.url).searchParams);
	await queryClient.ensureQueryData(projectTasksOptions(params.projectId, order));
	return null;
}
