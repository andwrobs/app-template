import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/components.route";
import { ComponentsPage } from "./components.page";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Components") },
];

export default ComponentsPage;
