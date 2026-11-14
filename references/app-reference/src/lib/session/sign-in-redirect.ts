// Leaving for the sign-in page is a page load, never a client navigation: it
// drops every store, the Query cache and every request in flight at once, so
// nothing has to remember to reset itself.

const channel =
	typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("session");

/** Only a path on this site: never a full URL someone put in the query string. */
export function safeReturnTo(value: string | null): string {
	return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function goToSignIn(returnTo?: string) {
	const search = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
	window.location.assign(`/sign-in${search}`);
}

/** A request came back 401: the session ended somewhere else. Come back here after. */
export function sessionExpired() {
	goToSignIn(window.location.pathname + window.location.search);
}

/** Tells this browser's other tabs, which leave too. */
export function announceSignOut() {
	channel?.postMessage("signed-out");
}

channel?.addEventListener("message", () => goToSignIn());
