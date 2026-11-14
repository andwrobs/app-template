import { layout, type RouteConfig, route } from "@react-router/dev/routes";

// The whole tree, in one place. File paths are relative to appDirectory
// (framework/src). src/root.tsx wraps this tree; it is not an entry here.
export default [
	route("sign-in", "routes/sign-in/sign-in.route.ts"),
	layout("routes/app-shell/app-shell.route.ts", [
		route("projects/:projectId", "routes/project/project.route.ts"),
	]),
	route("*", "routes/not-found/not-found.route.ts"),
] satisfies RouteConfig;
