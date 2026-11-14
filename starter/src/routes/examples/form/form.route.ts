import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/form.route";
import { FormPage } from "./form.page";

export const meta: Route.MetaFunction = () => [
	{ title: pageTitle("Form example") },
];

export default FormPage;
