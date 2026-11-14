/**
 * The one module that reads CSS media queries. Where `matchMedia` is missing
 * (some test environments) a query reads as `unsupported` and never changes.
 */
export function matchesMedia(query: string, unsupported = false): boolean {
	return window.matchMedia?.(query).matches ?? unsupported;
}

/** Calls `onChange` when `query` starts or stops matching; returns the unsubscribe. */
export function subscribeToMedia(
	query: string,
	onChange: (matches: boolean) => void,
): () => void {
	const list = window.matchMedia?.(query);
	if (!list) return () => {};
	const listener = () => onChange(list.matches);
	list.addEventListener("change", listener);
	return () => list.removeEventListener("change", listener);
}
