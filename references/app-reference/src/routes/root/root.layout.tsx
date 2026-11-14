import { Outlet, ScrollRestoration } from "react-router";
import { RouteFocus } from "~/lib/app/route-focus";

export function RootLayout() {
	return (
		<>
			<RouteFocus />
			<ScrollRestoration />
			<Outlet />
		</>
	);
}
