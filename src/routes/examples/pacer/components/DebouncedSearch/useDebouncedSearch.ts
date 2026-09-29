import { useDebouncer } from "@tanstack/react-pacer";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { typingState, useSearchDraft } from "~/lib/url-state/useSearchDraft";
import { searchQuery } from "../../task-search.query";
import type { DebouncedSearchProps } from "./DebouncedSearchView";

export const searchWait = 400;

// Debouncing a value: the box updates on every keystroke, and the URL (and so
// the search) updates once typing pauses. Router owns the term, Query owns the
// results, and Pacer owns the timing.
export function useDebouncedSearch(): DebouncedSearchProps {
	const [searchParams, setSearchParams] = useSearchParams();
	const term = searchParams.get("q") ?? "";
	const [draft, setDraft] = useSearchDraft(term);
	const draftRef = useRef(draft);
	const composing = useRef(false);
	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	const commit = (value: string) => {
		// Skip a search the box no longer shows, e.g. after Back restored it.
		if (value.trim() !== draftRef.current.trim()) return;
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				if (value.trim()) next.set("q", value.trim());
				else next.delete("q");
				return next;
			},
			{ replace: true, state: typingState },
		);
	};

	// useDebouncer cancels pending work on unmount, so leaving the page never
	// fires a late URL write.
	const debouncer = useDebouncer(commit, { wait: searchWait }, (state) => ({
		isPending: state.isPending,
		keystrokes: state.maybeExecuteCount,
		searches: state.executionCount,
	}));

	const schedule = (value: string) => {
		draftRef.current = value;
		if (value.trim() === "") {
			debouncer.cancel();
			commit("");
		} else {
			debouncer.maybeExecute(value);
		}
	};

	const results = useQuery({
		...searchQuery(term),
		placeholderData: keepPreviousData,
	});

	return {
		draft,
		term,
		isWaiting: debouncer.state.isPending,
		isSearching: results.isFetching,
		isStale: results.isPlaceholderData,
		results: term ? results.data : undefined,
		error: results.error?.message,
		keystrokes: debouncer.state.keystrokes,
		searches: debouncer.state.searches,
		onChange: (value) => {
			setDraft(value);
			// IME composition sends partial text; wait for the final value.
			if (!composing.current) schedule(value);
		},
		onCompositionStart: () => {
			composing.current = true;
		},
		onCompositionEnd: (value) => {
			composing.current = false;
			schedule(value);
		},
		onSearchNow: () => debouncer.flush(),
		onCancel: () => {
			debouncer.cancel();
			setDraft(term);
		},
		onRetry: () => {
			void results.refetch();
		},
	};
}
