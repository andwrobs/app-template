import { type RouteConfigEntry, route } from "@react-router/dev/routes";

// Removable examples. File paths are relative to src, like src/routes.ts.
export const exampleRoutes = [
	route("examples/query", "./routes/examples/query/query.route.ts"),
	route("examples/form", "./routes/examples/form/form.route.ts"),
	route("examples/table", "./routes/examples/table/table.route.ts"),
	route("examples/pacer", "./routes/examples/pacer/pacer.route.ts"),
	route(
		"examples/components",
		"./routes/examples/components/components.route.ts",
	),
] satisfies RouteConfigEntry[];
