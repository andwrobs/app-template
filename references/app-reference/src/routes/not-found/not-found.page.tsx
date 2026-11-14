import { RouteErrorMessage } from "~/lib/app/route-error";

/** A URL that matches no route reads the same as a record the server doesn't have. */
export function NotFoundPage() {
	return (
		<main>
			<title>Not found</title>
			<RouteErrorMessage kind="not-found" />
		</main>
	);
}
