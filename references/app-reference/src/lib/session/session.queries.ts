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
