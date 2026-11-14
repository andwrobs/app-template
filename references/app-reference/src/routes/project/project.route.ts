import { defineRoute } from "~/lib/router/define-route";
import { projectTasksOptions } from "./project.queries";
import { parseProjectSearch } from "./project.search";

export const projectRoute = defineRoute({
	path: "projects/:projectId",
	page: async () => (await import("./project.page")).ProjectPage,
	async load({ params, search }, { queryClient }) {
		const { order } = parseProjectSearch(search);
		await queryClient.ensureQueryData(projectTasksOptions(params.projectId, order));
	},
});
