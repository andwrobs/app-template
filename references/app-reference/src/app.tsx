import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "~/lib/app/app-providers";
import { createQueryClient } from "~/lib/query/query-client";
import { createRoutes } from "./routes";

// The app's composition root: one Query client, shared by the routes (for
// loaders and guards) and the provider (for components).
const queryClient = createQueryClient();
const router = createBrowserRouter(createRoutes({ queryClient }));

export function App() {
	return (
		<AppProviders queryClient={queryClient}>
			<RouterProvider router={router} />
		</AppProviders>
	);
}
