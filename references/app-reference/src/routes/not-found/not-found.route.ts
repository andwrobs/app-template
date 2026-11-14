import { defineRoute } from "~/lib/router/define-route";

export const notFoundRoute = defineRoute({
	path: "*",
	page: async () => (await import("./not-found.page")).NotFoundPage,
});
