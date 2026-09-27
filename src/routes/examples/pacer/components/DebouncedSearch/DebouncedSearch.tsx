import { Button } from "~/lib/ui/button";
import { FieldLabel } from "~/lib/ui/field";
import { Input } from "~/lib/ui/input";
import { TextField } from "~/lib/ui/text-field";
import { cn } from "~/lib/ui/utils";

export type DebouncedSearchProps = {
	draft: string;
	term: string;
	isWaiting: boolean;
	isSearching: boolean;
	isStale: boolean;
	results: Array<{ id: string; title: string }> | undefined;
	error: string | undefined;
	keystrokes: number;
	searches: number;
	onChange: (value: string) => void;
	onCompositionStart: () => void;
	onCompositionEnd: (value: string) => void;
	onSearchNow: () => void;
	onCancel: () => void;
	onRetry: () => void;
};

export function DebouncedSearch(props: DebouncedSearchProps) {
	return (
		<section aria-labelledby="debounce-heading" className="space-y-4">
			<div className="space-y-1">
				<h2 id="debounce-heading" className="text-xl font-semibold">
					Debounce a value: search
				</h2>
				<p className="max-w-2xl text-sm text-muted-foreground">
					The box updates as you type. The URL and the search wait until you
					pause, so fast typing sends one search. Enter searches now; Cancel
					drops the waiting search.
				</p>
			</div>
			<div className="flex flex-wrap items-end gap-2">
				<TextField
					type="search"
					value={props.draft}
					onChange={props.onChange}
					onKeyDown={(event) => {
						if (event.key === "Enter") props.onSearchNow();
					}}
					className="w-full sm:w-72"
				>
					<FieldLabel>Search sample tasks</FieldLabel>
					<Input
						placeholder="Try “sample”"
						onCompositionStart={props.onCompositionStart}
						onCompositionEnd={(event) =>
							props.onCompositionEnd(event.currentTarget.value)
						}
					/>
				</TextField>
				<Button
					variant="outline"
					isDisabled={!props.isWaiting}
					onPress={props.onSearchNow}
				>
					Search now
				</Button>
				<Button
					variant="ghost"
					isDisabled={!props.isWaiting}
					onPress={props.onCancel}
				>
					Cancel
				</Button>
			</div>
			<p role="status" className="text-sm">
				<SearchStatus {...props} />
			</p>
			<p className="text-sm text-muted-foreground tabular-nums">
				{count(props.keystrokes, "keystroke")} ·{" "}
				{count(props.searches, "search")}
			</p>
			{props.error && (
				<div role="alert" className="space-y-2 text-sm">
					<p className="text-destructive">{props.error}</p>
					<Button variant="outline" size="sm" onPress={props.onRetry}>
						Try again
					</Button>
				</div>
			)}
			{props.results && props.results.length > 0 && (
				<ul
					aria-label="Search results"
					className={cn(
						"divide-y rounded-lg border text-sm transition-opacity",
						props.isStale && "opacity-60",
					)}
				>
					{props.results.map((task) => (
						<li key={task.id} className="flex gap-3 px-3 py-2">
							<span className="text-muted-foreground tabular-nums">
								{task.id}
							</span>
							{task.title}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function count(n: number, noun: string) {
	return `${n} ${n === 1 ? noun : noun.endsWith("h") ? `${noun}es` : `${noun}s`}`;
}

function SearchStatus({
	term,
	isWaiting,
	isSearching,
	results,
}: DebouncedSearchProps) {
	if (isWaiting) return "Waiting for you to pause…";
	if (isSearching) return `Searching for “${term}”…`;
	if (!term) return "Type to search the sample tasks.";
	if (!results) return null;
	return results.length === 1
		? `1 task matches “${term}”.`
		: `${results.length} tasks match “${term}”.`;
}
