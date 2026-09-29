import { queryOptions } from "@tanstack/react-query";
import { taskSearchService } from "~/services";

export function searchQuery(term: string) {
	return queryOptions({
		queryKey: ["demo-search", term],
		queryFn: ({ signal }) => taskSearchService.search(term, { signal }),
		enabled: term !== "",
	});
}
