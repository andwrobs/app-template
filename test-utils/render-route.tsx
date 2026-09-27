import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "react-aria-components";
import {
	createRoutesStub,
	Outlet,
	useHref,
	useLocation,
	useNavigate,
} from "react-router";

type StubRoutes = Parameters<typeof createRoutesStub>[0];

// Aria links navigate through the router, as in lib/app/AppProviders. The
// output and button let tests read the URL and go Back.
function TestShell() {
	const navigate = useNavigate();
	const location = useLocation();
	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<Outlet />
			<output aria-label="Test location">
				{location.pathname}
				{location.search}
			</output>
			<button type="button" onClick={() => navigate(-1)}>
				Test back
			</button>
		</RouterProvider>
	);
}

/**
 * Renders route modules in a memory router with a Query provider. Pass the
 * shared queryClient when a clientLoader writes to it; otherwise each call
 * gets its own cache. With fake timers, pass
 * `userOptions: { advanceTimers: vi.advanceTimersByTime }`.
 */
export function renderRoute(
	routes: StubRoutes,
	{
		initialEntries = ["/"],
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		}),
		userOptions,
	}: {
		initialEntries?: string[];
		queryClient?: QueryClient;
		userOptions?: Parameters<typeof userEvent.setup>[0];
	} = {},
) {
	const Stub = createRoutesStub([
		{ Component: TestShell, HydrateFallback: () => null, children: routes },
	]);
	const user = userEvent.setup(userOptions);
	const result = render(
		<QueryClientProvider client={queryClient}>
			<Stub initialEntries={initialEntries} />
		</QueryClientProvider>,
	);
	return { ...result, user, queryClient };
}
