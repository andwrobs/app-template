import { queryOptions } from "@tanstack/react-query";
import { getTaskSearchService } from "~/services";

export function searchQuery(term: string) {
	return queryOptions({
		queryKey: ["demo-search", term],
		queryFn: ({ signal }) => getTaskSearchService().search(term, { signal }),
		enabled: term !== "",
	});
}
