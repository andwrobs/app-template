import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/** Every app-wide provider, in one place. */
export function AppProviders({
	queryClient,
	children,
}: {
	queryClient: QueryClient;
	children: ReactNode;
}) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
