import { type RouteConfigEntry, route } from "@react-router/dev/routes";

// Removable examples. File paths are relative to src, like src/routes.ts.
export const exampleRoutes = [
	route("examples/query", "./routes/examples/query/query.route.tsx"),
	route("examples/form", "./routes/examples/form/form.route.tsx"),
	route("examples/table", "./routes/examples/table/table.route.tsx"),
	route("examples/pacer", "./routes/examples/pacer/pacer.route.tsx"),
	route(
		"examples/components",
		"./routes/examples/components/components.route.tsx",
	),
] satisfies RouteConfigEntry[];
