import { DebouncedSearchView } from "./debounced-search-view";
import { useDebouncedSearch } from "./use-debounced-search";

export function DebouncedSearch() {
	const props = useDebouncedSearch();
	return <DebouncedSearchView {...props} />;
}
