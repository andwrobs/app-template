import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AppProviders } from "~/lib/app/app-providers";
import { errorKind } from "~/lib/app/route-error";
import { RouteFocus } from "~/lib/app/route-focus";
import type { Route } from "./+types/root";
import { queryClient } from "./lib/query-client.client";

// SPA mode still prerenders this document and the root HydrateFallback at
// build time. Neither depends on a browser, a session, or a Query client.
export function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return (
		<AppProviders queryClient={queryClient}>
			<RouteFocus />
			<Outlet />
		</AppProviders>
	);
}

export function HydrateFallback() {
	return <p aria-busy="true">Loading…</p>;
}

// A root boundary must also work while prerendering. The shared Data Mode
// RouteError's retry link reads window.location, so this uses a document link.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const kind = errorKind(error);
	const title = {
		"not-found": "Not found",
		forbidden: "No access",
		offline: "You're offline",
		unexpected: "Something went wrong",
	}[kind];
	return (
		<main role="alert">
			<title>{title}</title>
			<h1>{title}</h1>
			<p>{kind === "offline" ? "Check your connection, then try again." : "Try another page or reload to try again."}</p>
			<a href="/sign-in">Go to sign in</a>
		</main>
	);
}
