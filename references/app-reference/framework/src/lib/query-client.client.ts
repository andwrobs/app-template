import { createQueryClient } from "~/lib/query/query-client";

// One instance per browser page load, shared by native route handlers and
// AppProviders. Full-page sign-in/sign-out redirects discard it together.
export const queryClient = createQueryClient();
