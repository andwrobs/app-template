import type React from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { AppLayout } from "~/lib/app/AppLayout";
import { AppProviders } from "~/lib/app/AppProviders";
import { useReloadPage } from "~/lib/app/useReloadPage";
import { pageTitle } from "~/lib/meta/title";
import { themeScript } from "~/lib/theme/theme";
import { Button, LinkButton } from "~/lib/ui/button";
import type { Route } from "./+types/root";

import "~/styles/index.css";

// Routes without their own meta, the SPA build's index.html, and error pages use
// this.
export const meta: Route.MetaFunction = ({ error }) => [
	{ title: pageTitle(error ? "Error" : undefined) },
];

export function HydrateFallback() {
	return (
		<p className="p-8" role="status">
			Loading the starter…
		</p>
	);
}

/**
 * Special file `root.tsx` root route supports a `Layout` export, routes defined in `routes.ts` do not.
 *
 * The `Layout` component serves 2 purposes:
 * - Avoid duplicating your document's "app shell" across your root component, `HydrateFallback`, and `ErrorBoundary`
 * - Prevent React from re-mounting your app shell elements when switching between the root component/HydrateFallback/ErrorBoundary
 * which can cause a FOUC if React removes and re-adds `<link>` tags from your `<Links>` component.
 *
 * https://reactrouter.com/explanation/special-files#layout-export
 */
export function Layout({ children }: { children: React.ReactNode }) {
	return (
		// The head script sets the theme class before React hydrates.
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed inline script from lib/theme, no user input.
					dangerouslySetInnerHTML={{ __html: themeScript }}
				/>
				<Meta />
				<Links />
			</head>
			<body>
				<AppProviders>{children}</AppProviders>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

/**
 * All routes configured in routes.ts are rendered through the `<Outlet/>` in this component.
 * https://reactrouter.com/start/framework/route-module#component-default
 */
export default function RootRoute() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}

/**
 * Route modules will automatically catch errors in your code and render the closest ErrorBoundary.
 *
 * All application's should at a minimum export a root error boundary to protect against unhandled exceptions in:
 * - clientLoader
 * - clientAction
 * - component code
 *
 * https://reactrouter.com/how-to/error-boundary#error-boundaries
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const reload = useReloadPage();
	let title = "Something went wrong";
	let details = "An unexpected error stopped this page. Reload to try again.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		title = error.status === 404 ? "Page not found" : `Error ${error.status}`;
		details =
			error.status === 404
				? "Nothing lives at this address."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	console.error(error);

	// Rendered without the app shell, in case the shell is what failed.
	return (
		<main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-16 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">Error</p>
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				<p className="text-muted-foreground">{details}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				<Button onPress={reload}>Reload</Button>
				<LinkButton href="/" variant="outline">
					Go to the overview
				</LinkButton>
			</div>
			{stack && (
				<pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
