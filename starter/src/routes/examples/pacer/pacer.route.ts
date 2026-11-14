import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/pacer.route";
import { PacerPage } from "./pacer.page";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Pacer example") },
];

export default PacerPage;
