import { isRouteErrorResponse, Link } from "react-router";
import { ApiError, isForbidden, isNotFound, isOffline } from "~/lib/api/api-error";

export type ErrorKind = "not-found" | "forbidden" | "offline" | "unexpected";

/** What went wrong, in the user's terms. */
export function errorKind(error: unknown): ErrorKind {
	const status = isRouteErrorResponse(error) ? error.status : undefined;
	if (status === 404 || isNotFound(error)) return "not-found";
	if (status === 403 || isForbidden(error)) return "forbidden";
	if (isOffline(error)) return "offline";
	return "unexpected";
}

const messages: Record<ErrorKind, { title: string; body: string }> = {
	"not-found": { title: "Not found", body: "This page doesn't exist, or you can't open it." },
	forbidden: { title: "No access", body: "You don't have access to this page." },
	offline: { title: "You're offline", body: "Check your connection, then try again." },
	unexpected: { title: "Something went wrong", body: "Try again. If it keeps happening, tell us." },
};

/** One failure, said the same way wherever it happens. */
export function RouteErrorMessage({ kind }: { kind: ErrorKind }) {
	const { title, body } = messages[kind];
	return (
		<div role="alert">
			<h1>{title}</h1>
			<p>{body}</p>
			{kind === "offline" || kind === "unexpected" ? (
				<a href={window.location.href}>Try again</a>
			) : (
				<Link to="/">Go home</Link>
			)}
		</div>
	);
}

/** What every route's error boundary renders. */
export function RouteError({ error }: { error: unknown }) {
	const kind = errorKind(error);
	// An unexpected error is a bug: report it. `ApiError`s are already reported once.
	if (kind === "unexpected" && !(error instanceof ApiError)) console.error(error);
	return <RouteErrorMessage kind={kind} />;
}
