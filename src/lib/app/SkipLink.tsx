// The browser moves focus to #main-content, which AppLayout makes focusable.
export function SkipLink() {
	return (
		<a
			href="#main-content"
			className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium ring-3 ring-ring/50 focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50"
		>
			Skip to main content
		</a>
	);
}
