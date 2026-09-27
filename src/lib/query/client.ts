import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: 60_000, retry: 1 },
		},
	});
}

// One cache per browser app, shared by clientLoaders and React. The SPA build
// may import this module but never populates it with user data at build time.
export const queryClient = createQueryClient();
