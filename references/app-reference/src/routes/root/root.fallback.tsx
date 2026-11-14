/** Shown once, while the first page's code and data load. Imported eagerly, so it has no dependencies. */
export function RootFallback() {
	return <p aria-busy="true">Loading…</p>;
}
