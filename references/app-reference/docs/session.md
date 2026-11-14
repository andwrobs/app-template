# Session

Who is signed in, how pages are guarded, what happens when a session ends, and
how what the browser remembers is kept apart per person.

Part of the [app reference](README.md).

The implementation below belongs to the Data Mode app under `src/`. A Framework
Mode app uses native route-module exports; `routes.ts` only names module files and runs
no guards. See [Framework Mode routing](framework-routing.md).

## The session is server data

Who is signed in is a fact the server holds, so Query owns it like any other. There
is no session store.

```ts
// src/lib/session/session.service.ts
import type { ApiClient } from "~/lib/api/api-client";

export type Session = { viewerId: string; name: string };

export function createSessionService({ request }: ApiClient) {
	return {
		current: (signal?: AbortSignal) => request<Session>("/api/session", { signal }),
		signIn: (credentials: { email: string; password: string }) =>
			request<Session>("/api/session", {
				method: "POST",
				body: JSON.stringify(credentials),
			}),
		signOut: () => request<void>("/api/session", { method: "DELETE" }),
	};
}
```

```ts
// src/lib/session/session.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getSessionService } from "~/services";

/** Who is signed in. Server data like any other, so Query owns it. */
export function sessionOptions() {
	return queryOptions({
		queryKey: ["session"],
		queryFn: ({ signal }) => getSessionService().current(signal),
		staleTime: 5 * 60_000,
	});
}
```

```ts
// src/lib/session/session.ts
import type { QueryClient } from "@tanstack/react-query";
import { setViewer } from "~/lib/preferences/viewer-storage";
import { getSessionService } from "~/services";
import { sessionOptions } from "./session.queries";
import { announceSignOut, goToSignIn } from "./sign-in-redirect";

/** The session, loading it once. Tells browser storage whose it is. */
export async function requireSession(queryClient: QueryClient) {
	const session = await queryClient.ensureQueryData(sessionOptions());
	setViewer(session.viewerId);
	return session;
}

export async function signOut() {
	await getSessionService().signOut();
	announceSignOut();
	goToSignIn();
}
```

Components read it with `useSuspenseQuery(sessionOptions())`; under the shell it is
always there, because the guard loaded it.

Keep credentials out of JavaScript. The session travels in an `HttpOnly` cookie
that the client sends and never reads. Nothing in this app stores a token.

## Guarding pages

One guard on the shell route calls `requireSession()` before any page beneath it
loads ([routing](routing.md#the-session-guard)). It does two things:
loads the session, and tells browser storage whose it is.

Pages don't check the session, and loaders don't catch 401s.

The [Framework Mode example](../framework/README.md) uses native
`clientMiddleware` in `app-shell.route.ts` to call `requireSession` with its shared
browser QueryClient before invoking the child loaders. A session 401 triggers a
document redirect; other errors reach the root boundary. A parent `clientLoader`
alone would not serialize child loaders, which can run in parallel. `routes.ts` declares the route tree; the shell's route module owns the guard. The API enforces authorization in either mode.

If authentication moves to server loaders or actions, use the request's cookie
and the server's session API there. Browser storage setup and the Query client's
browser redirect handler remain browser concerns; do not call the Data Mode
`requireSession` unchanged from a server loader.

## A session that ends

Leaving for the sign-in page is always a page load, never a client-side
navigation.

```ts
// src/lib/session/sign-in-redirect.ts
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
```

A page load drops every store, the whole Query cache and every request in flight,
at once. The alternative is for each store to reset itself when the session ends,
and that is only as complete as the last store someone remembered to wire up. The
failure it risks is the worst kind: one person's data shown to the next. A page
load can't forget.

There are three ways a session ends, and each ends in `goToSignIn`:

| How | Handled by |
| --- | --- |
| The user signs out | `signOut()`: tells the server, tells the other tabs, leaves |
| A request comes back 401 | The Query client's error handler calls `sessionExpired()`, which leaves and remembers where to come back to |
| Another tab signed out | The broadcast channel's listener leaves |

Signing in is a page load too, so the app starts clean for whoever signed in:

```tsx
// src/routes/sign-in/sign-in.page.tsx
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { safeReturnTo } from "~/lib/session/sign-in-redirect";
import { getSessionService } from "~/services";

export function SignInPage() {
	const [search] = useSearchParams();
	const signIn = useMutation({
		mutationFn: getSessionService().signIn,
		// A page load, so the app starts clean for whoever just signed in.
		onSuccess: () => window.location.assign(safeReturnTo(search.get("returnTo"))),
	});
	function submit(form: FormData) {
		signIn.mutate({
			email: String(form.get("email")),
			password: String(form.get("password")),
		});
	}
	return (
		<main>
			<title>Sign in</title>
			<h1>Sign in</h1>
			<form action={submit}>
				<label>
					Email <input autoComplete="username" name="email" required type="email" />
				</label>
				<label>
					Password{" "}
					<input autoComplete="current-password" name="password" required type="password" />
				</label>
				<button disabled={signIn.isPending} type="submit">
					Sign in
				</button>
				{signIn.isError ? <p role="alert">That didn't work. Check both and try again.</p> : null}
			</form>
		</main>
	);
}
```

`safeReturnTo` accepts only a path on this site. A full URL in `returnTo` would let
a crafted link send someone to another site right after they sign in.

## What the browser remembers, per person

Everything persisted goes through one storage adapter, and every key it writes
ends in the viewer's id.

```ts
// src/lib/preferences/viewer-storage.ts
import type { StateStorage } from "zustand/middleware";

// The one module that touches `localStorage`. Every key belongs to one
// viewer, so two people sharing a browser never see each other's values.

let viewerId: string | null = null;
const listeners = new Set<() => void>();

const keyFor = (name: string) => `${name}:${viewerId}`;

/**
 * Says whose storage this is. Called once per page load, when the session is
 * known; persisted stores then load that viewer's values.
 */
export function setViewer(id: string) {
	if (id === viewerId) return;
	viewerId = id;
	for (const listener of listeners) listener();
}

export function onViewerChange(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Another tab wrote `name`. */
export function onStoredChange(name: string, listener: () => void): () => void {
	const onStorage = (event: StorageEvent) => {
		if (viewerId && event.key === keyFor(name)) listener();
	};
	window.addEventListener("storage", onStorage);
	return () => window.removeEventListener("storage", onStorage);
}

/**
 * Storage for `persist`. Before the viewer is known it holds nothing. Storage
 * can also be missing or throw (private windows, blocked site data); a value
 * then lasts only for this visit.
 */
export const viewerStorage: StateStorage = {
	getItem: (name) => {
		if (!viewerId) return null;
		try {
			return localStorage.getItem(keyFor(name));
		} catch {
			return null;
		}
	},
	setItem: (name, value) => {
		if (!viewerId) return;
		try {
			localStorage.setItem(keyFor(name), value);
		} catch {
			// Not remembering is acceptable.
		}
	},
	removeItem: (name) => {
		if (!viewerId) return;
		try {
			localStorage.removeItem(keyFor(name));
		} catch {
			// Nothing to remove.
		}
	},
};
```

- The guard calls `setViewer` once per page load. Until then storage reads as
  empty and writes are dropped, so nothing is ever read or written under the wrong
  person.
- Each persisted store sets `skipHydration`, subscribes with `onViewerChange`, and
  loads its values then ([app state and persistence](state/app-state-and-persistence.md)).
- Signing out doesn't erase a person's settings. They are still there, under their
  own id, when they sign in again.

Two people sharing one browser profile is the case this exists for. Without it,
the second person inherits the first one's view, recent items and expanded
folders, and the last of those are a list of things they may not be allowed to
see.

## What the server allows

The interface hides what the viewer can't do; the server refuses it. Ask the
server what this viewer may do (a capabilities query), render controls from the
answer, and treat a loading or failed answer as "nothing privileged". Never treat
a hidden button as protection.

## Secrets

A value the user types that must not linger (an API key, a recovery code) stays
out of anything that outlives the request: rendered state, the URL, storage, the
Query cache, and mutation variables, which the mutation cache keeps. Hold it in a
ref in the form's feature hook, read it inside `mutationFn`, and clear it on
success, on cancel and on leaving.
