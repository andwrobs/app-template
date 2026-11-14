import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/not-found.route";
import { NotFoundPage } from "./not-found.page";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Page not found") },
];

export default NotFoundPage;
