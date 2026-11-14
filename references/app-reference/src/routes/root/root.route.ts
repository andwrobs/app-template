import { defineRoute } from "~/lib/router/define-route";
import { RootFallback } from "./root.fallback";

/** Wraps every page: focus and scroll on navigation, and the first-load fallback. */
export const rootRoute = defineRoute({
	page: async () => (await import("./root.layout")).RootLayout,
	fallback: RootFallback,
});
