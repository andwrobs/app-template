import { useAsyncThrottler } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { saveNote } from "../../demo-server";
import type { ThrottledAutosaveProps } from "./ThrottledAutosave";

export const saveInterval = 1000;

// Pacing an async mutation: while you type, Pacer starts a save at most once a
// second and never two at once, and the trailing call saves the last edit.
// Query owns the save itself; Pacer only decides when to call it.
export function useThrottledAutosave(): ThrottledAutosaveProps {
	const [text, setText] = useState("");
	const [saved, setSaved] = useState<{ text: string; savedAt: number }>();
	const [saves, setSaves] = useState(0);
	const save = useMutation({
		mutationFn: saveNote,
		onSuccess: (result) => {
			setSaved(result);
			setSaves((count) => count + 1);
		},
	});

	const throttler = useAsyncThrottler(
		(value: string) => save.mutateAsync(value),
		{
			wait: saveInterval,
			// The mutation keeps the error; don't reject maybeExecute as well.
			onError: () => undefined,
			// Leaving the page saves the last edit instead of dropping it. (In
			// 0.23.0, cancel() can't stop an edit queued behind a running save.)
			onUnmount: (throttler: { flush: () => Promise<unknown> }) => {
				void throttler.flush();
			},
		},
		(state) => ({ isPending: state.isPending, edits: state.maybeExecuteCount }),
	);

	return {
		text,
		saved,
		saves,
		edits: throttler.state.edits,
		isWaiting: throttler.state.isPending,
		isSaving: save.isPending,
		error: save.error?.message,
		onChange: (value) => {
			setText(value);
			void throttler.maybeExecute(value);
		},
		onSaveNow: () => {
			void throttler.flush();
		},
		onDiscard: () => throttler.cancel(),
	};
}
