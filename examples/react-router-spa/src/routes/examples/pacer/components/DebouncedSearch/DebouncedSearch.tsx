import { DebouncedSearchView } from "./DebouncedSearchView";
import { useDebouncedSearch } from "./useDebouncedSearch";

export function DebouncedSearch() {
	const props = useDebouncedSearch();
	return <DebouncedSearchView {...props} />;
}
