import {
	DebouncedSearch,
	useDebouncedSearch,
} from "./components/DebouncedSearch";
import {
	ThrottledAutosave,
	useThrottledAutosave,
} from "./components/ThrottledAutosave";

export default function PacerRoute() {
	const searchProps = useDebouncedSearch();
	const autosaveProps = useThrottledAutosave();
	return (
		<main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Example 04 · TanStack Pacer
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Wait for the pause, or pace the work.
				</h1>
				<p className="max-w-2xl text-muted-foreground">
					Debouncing waits until input stops. Throttling runs work at a steady
					rate while input continues. Pacer is pinned at 0.23.0; it's pre-1.0,
					so read the release notes and rerun these tests before upgrading.
				</p>
			</div>
			<DebouncedSearch {...searchProps} />
			<ThrottledAutosave {...autosaveProps} />
		</main>
	);
}
