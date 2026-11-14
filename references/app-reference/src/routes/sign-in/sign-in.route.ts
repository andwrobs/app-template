import { defineRoute } from "~/lib/router/define-route";

/** Outside the shell, so it has no guard. */
export const signInRoute = defineRoute({
	path: "sign-in",
	page: async () => (await import("./sign-in.page")).SignInPage,
});
