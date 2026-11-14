export type ApiErrorKind =
	/** No reply: offline, a dropped connection, a timeout. */
	| "network"
	/** The server replied with an error status. */
	| "http"
	/** The server replied with something this client can't read. */
	| "invalid-response";

/** The one error every service call throws. */
export class ApiError extends Error {
	constructor(
		readonly kind: ApiErrorKind,
		readonly status?: number,
		options?: ErrorOptions,
	) {
		super(status ? `API ${kind} ${status}` : `API ${kind}`, options);
		this.name = "ApiError";
	}
}

const statusOf = (error: unknown) =>
	error instanceof ApiError ? error.status : undefined;

export const isUnauthorized = (error: unknown) => statusOf(error) === 401;
export const isNotFound = (error: unknown) => statusOf(error) === 404;
export const isForbidden = (error: unknown) => statusOf(error) === 403;
export const isOffline = (error: unknown) =>
	error instanceof ApiError && error.kind === "network";

/** Worth one more try: no reply, or the server failed. Never a 4xx. */
export const isTransient = (error: unknown) =>
	error instanceof ApiError &&
	(error.kind === "network" || (error.status ?? 0) >= 500);

export type FailureReason = "invalid" | "forbidden" | "not-found" | "conflict" | "refused";

/**
 * How a write that threw should be shown. The server said no (a 4xx): failed,
 * and nothing changed. Anything else, it may have done the work: uncertain.
 */
export function classifyFailure(
	error: unknown,
): { status: "failed"; reason: FailureReason } | { status: "uncertain" } {
	const status = statusOf(error);
	if (status === undefined || status >= 500) return { status: "uncertain" };
	if (status === 400 || status === 422) return { status: "failed", reason: "invalid" };
	if (status === 403) return { status: "failed", reason: "forbidden" };
	if (status === 404) return { status: "failed", reason: "not-found" };
	if (status === 409) return { status: "failed", reason: "conflict" };
	return { status: "failed", reason: "refused" };
}
