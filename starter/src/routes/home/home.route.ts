import { pageTitle } from "~/lib/meta/title";
import type { Route } from "./+types/home.route";
import { HomePage } from "./home.page";

export const meta: Route.MetaFunction = () => [{ title: pageTitle() }];

export default HomePage;
