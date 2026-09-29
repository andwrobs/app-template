import { useAsyncThrottler } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { saveNote } from "../../demo-server";
import type { ThrottledAutosaveProps } from "./ThrottledAutosaveView";

export const saveInterval = 1000;

type SaveRequest = { text: string; revision: number };

// Pacing an async mutation: while you type, Pacer starts a save at most once a
// second and never two at once, and the trailing call saves the last edit.
// Query owns the save itself; Pacer only decides when to call it.
//
// In 0.23.0, an edit made during a running save waits where cancel() can't
// reach it and isPending doesn't show it. So each request gets a revision:
// an edit is waiting until its save starts or Discard passes it, and the save
// function skips discarded revisions.
export function useThrottledAutosave(): ThrottledAutosaveProps {
	const [text, setText] = useState("");
	const [edits, setEdits] = useState(0);
	const [serverFails, setServerFails] = useState(false);
	const [saved, setSaved] = useState<{ text: string; savedAt: number }>();
	const [saves, setSaves] = useState(0);
	const [requested, setRequested] = useState(0);
	const [discarded, setDiscarded] = useState(0);

	const save = useMutation({
		mutationFn: (request: SaveRequest) => saveNote(request.text, serverFails),
		onSuccess: (result) => {
			setSaved(result);
			setSaves((count) => count + 1);
		},
	});

	const throttler = useAsyncThrottler(
		async (request: SaveRequest) => {
			if (request.revision > discarded) await save.mutateAsync(request);
		},
		{
			wait: saveInterval,
			// The mutation keeps the error; don't reject maybeExecute as well.
			onError: () => undefined,
			// Leaving the page saves the last edit instead of dropping it.
			onUnmount: (throttler: { flush: () => Promise<unknown> }) => {
				void throttler.flush();
			},
		},
	);

	const requestSave = (value: string) => {
		const revision = requested + 1;
		setRequested(revision);
		void throttler.maybeExecute({ text: value, revision });
	};

	const isSaving = save.isPending;
	const isWaiting =
		requested > Math.max(save.variables?.revision ?? 0, discarded);
	// Flushing during a running save would start a second one beside it.
	const canSaveNow = isWaiting && !isSaving;

	return {
		text,
		saved,
		saves,
		edits,
		isWaiting,
		isSaving,
		canSaveNow,
		error: save.error?.message,
		serverFails,
		onChange: (value) => {
			setText(value);
			setEdits((count) => count + 1);
			requestSave(value);
		},
		onSaveNow: () => {
			if (canSaveNow) void throttler.flush();
		},
		// Drops every edit that hasn't started saving; a running save finishes.
		onDiscard: () => {
			throttler.cancel();
			setDiscarded(requested);
		},
		// Saves the note as it is now, once no other save is running.
		onRetry: () => {
			requestSave(text);
			if (!isSaving) void throttler.flush();
		},
		onServerFailsChange: setServerFails,
	};
}
