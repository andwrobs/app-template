import { Outlet } from "react-router";
import { NavigationProgress } from "~/lib/app/navigation-progress";

/** What stays on screen through every signed-in page. */
export function AppShellLayout() {
	return (
		<>
			<NavigationProgress />
			<nav aria-label="Main">{/* Navigation. */}</nav>
			<main>
				<Outlet />
			</main>
		</>
	);
}
