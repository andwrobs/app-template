# Commands

Part of the [app reference](../README.md), under [state](README.md).

A command is a write: something the user does that the server must carry out. Its
request has state of its own (sending, failed, done), and that state belongs to
whoever observes it.

| The write | Shape |
| --- | --- |
| One hook starts it and shows its progress (save a form, toggle a star, rename inline) | `useMutation` in the feature hook |
| Several capabilities of one screen observe it, or it changes shared screen state (a dialog, a toolbar, a status line and a selection all follow one Archive) | A command slice in the route store |
| It must continue after the screen is gone (an upload, an export) | An app-lifetime owner in `src/lib` |

Choose by observers, not by size. Most writes are the first row.

## One observer: a mutation

Query owns the request state. Mutation hooks live in the domain's `.mutations.ts`,
beside its `.queries.ts`, and each one refreshes what its write changed.

```ts
// src/lib/tasks/tasks.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "~/services";
import { taskKeys } from "./tasks.queries";
import type { Task, TaskOrder } from "./tasks.service";

/** Renames a task, then refreshes every list and detail in its project. */
export function useRenameTask(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: taskService.rename,
		// Whatever happened, show what the server holds.
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}

/**
 * Stars a task and shows it at once. Optimistic because it is one field, the
 * server rarely refuses, and putting it back is exact.
 */
export function useStarTask(projectId: string, order: TaskOrder) {
	const queryClient = useQueryClient();
	const key = taskKeys.list(projectId, order);
	return useMutation({
		mutationFn: taskService.star,
		async onMutate({ taskId, starred }) {
			// A refetch already in flight would overwrite the optimistic value.
			await queryClient.cancelQueries({ queryKey: key });
			const before = queryClient.getQueryData<Task[]>(key);
			queryClient.setQueryData<Task[]>(key, (tasks) =>
				tasks?.map((task) => (task.id === taskId ? { ...task, starred } : task)),
			);
			return { before };
		},
		onError: (_error, _input, context) => {
			queryClient.setQueryData(key, context?.before);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}
```

A form that drives it stays in the capability, and is the only place the form and
the mutation meet:

```ts
// src/routes/project/rename/use-rename-form.ts
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { classifyFailure } from "~/lib/api/api-error";
import { useRenameTask } from "~/lib/tasks/tasks.mutations";
import type { Task } from "~/lib/tasks/tasks.service";

const schema = z.object({ name: z.string().trim().min(1, "Give the task a name.") });

/**
 * The rename form. The form owns the draft and its validation; the mutation
 * owns the request; this hook is the only place they meet.
 */
export function useRenameForm(projectId: string, task: Task, onRenamed: () => void) {
	const rename = useRenameTask(projectId);
	const form = useForm({
		defaultValues: { name: task.name },
		validators: { onSubmit: schema },
		async onSubmit({ value }) {
			// A failure stays in `rename.error`; the draft is kept so the user can retry.
			await rename.mutateAsync({ taskId: task.id, name: value.name.trim() });
			onRenamed();
		},
	});
	return {
		form,
		saving: rename.isPending,
		/** What to say about the last attempt, if it didn't work. */
		failure: rename.error ? classifyFailure(rename.error) : null,
	};
}
```

Don't copy `isPending` or the result into a store. If a second capability needs to
know, the write has more than one observer and is a command slice.

## Several observers: a command slice

The rules are pure transitions. Each takes the slice's state and an intent and
returns a **step**: the next state and, when there is one, the request to send.

```ts
// src/routes/project/archive/archive-flow.ts
// Pure transitions for Archive: what each intent does to the dialog and its
// one request. The slice applies them and sends what they ask for.

export type ArchiveIntent = { key: string; taskIds: readonly string[] };

/** What the port resolves to. It never rejects. */
export type SettledArchive =
	| { status: "done"; archived: readonly string[] }
	| { status: "failed"; reason: string }
	/** No reply: the server may or may not have done it. */
	| { status: "uncertain" };

export type ArchiveState = {
	open: boolean;
	/** What the dialog is for, as the user chose it. */
	taskIds: readonly string[];
	request:
		| { status: "idle" }
		| { status: "sending"; intent: ArchiveIntent }
		| { status: "failed"; intent: ArchiveIntent; reason: string }
		| { status: "uncertain"; intent: ArchiveIntent };
	notice: string | null;
};

export type ArchiveStep = { next: ArchiveState; send?: ArchiveIntent };

export const initialArchive: ArchiveState = {
	open: false,
	taskIds: [],
	request: { status: "idle" },
	notice: null,
};

export function startArchive(
	state: ArchiveState,
	taskIds: readonly string[],
): ArchiveStep | undefined {
	if (state.request.status === "sending" || taskIds.length === 0) return undefined;
	return { next: { ...initialArchive, open: true, taskIds } };
}

export function confirmArchive(
	state: ArchiveState,
	newKey: string,
): ArchiveStep | undefined {
	if (!state.open || state.request.status === "sending") return undefined;
	// A retry repeats the same intent under the same key, so the server can
	// recognize a request it already carried out.
	const intent =
		state.request.status === "idle"
			? { key: newKey, taskIds: state.taskIds }
			: state.request.intent;
	return { next: { ...state, request: { status: "sending", intent } }, send: intent };
}

export function closeArchive(state: ArchiveState): ArchiveState {
	return { ...state, open: false };
}

export function finishArchive(
	state: ArchiveState,
	sent: ArchiveIntent,
	settled: SettledArchive,
): { next?: ArchiveState; archived: readonly string[] } {
	const archived = settled.status === "done" ? settled.archived : [];
	// Only the reply still awaited changes what shows.
	const awaited =
		state.request.status === "sending" && state.request.intent.key === sent.key;
	if (!awaited) return { archived };
	if (settled.status === "done") {
		return {
			archived,
			next: { ...initialArchive, notice: `Archived ${archived.length}.` },
		};
	}
	return {
		archived,
		next: {
			...state,
			request:
				settled.status === "failed"
					? { status: "failed", intent: sent, reason: settled.reason }
					: { status: "uncertain", intent: sent },
		},
	};
}
```

The slice applies the step, sends through its port, and hands the reply to another
transition:

```ts
// src/routes/project/archive/archive.slice.ts
import type { Slice, SliceScope } from "~/lib/route-store/route-store";
import {
	type ArchiveIntent,
	type ArchiveState,
	type ArchiveStep,
	closeArchive,
	confirmArchive,
	finishArchive,
	type SettledArchive,
	startArchive,
} from "./archive-flow";

export type { ArchiveState };

export type ArchiveActions = {
	start(taskIds: readonly string[]): void;
	/** Sends the archive, or sends it again after a failed or uncertain reply. */
	confirm(): void;
	close(): void;
};

export type ArchiveDeps = {
	/** Sends one archive and refreshes what it touched. Never rejects. */
	sendArchive(intent: ArchiveIntent): Promise<SettledArchive>;
	newKey(): string;
	/** These tasks left the page. */
	archived(taskIds: readonly string[]): void;
};

export function createArchiveSlice(
	{ get, set }: SliceScope<ArchiveState>,
	{ sendArchive, newKey, archived }: ArchiveDeps,
): Slice<ArchiveActions> {
	function run(step: ArchiveStep | undefined, action: string) {
		if (!step) return;
		set(step.next, action);
		const sent = step.send;
		if (!sent) return;
		void sendArchive(sent).then((settled) => {
			const finished = finishArchive(get(), sent, settled);
			if (finished.archived.length > 0) archived(finished.archived);
			if (finished.next) set(finished.next, "settled");
		});
	}
	return {
		actions: {
			start: (taskIds) => run(startArchive(get(), taskIds), "start"),
			confirm: () => run(confirmArchive(get(), newKey()), "confirm"),
			close: () => set(closeArchive(get()), "close"),
		},
	};
}
```

What makes this hold up:

- **The transitions decide; the slice only applies and sends.** Every rule (one
  request at a time, what a retry repeats, what a failure shows) is a pure function
  you can test with plain values.
- **The request in state carries an idempotency key.** `newKey()` is a port, so
  tests choose it. A retry sends the same intent under the same key, so a server
  that already carried the request out can recognize it.
- **Only the awaited reply changes what shows.** `finishArchive` compares the
  reply's key with the request in state. A reply to a superseded request changes
  nothing in the dialog.
- **Effects on other capabilities are callbacks.** Archived tasks leave the
  selection through `archived(ids)`, which the store wires to the selection
  slice. That happens even when the reply is no longer awaited, because the tasks
  are gone either way.
- **The port never rejects.** It resolves to done, failed or uncertain, using the
  one classifier every write shares ([server data](../server-data.md#errors)). Uncertain
  means no reply arrived and the server may have done the work; treat it as its own
  state with its own wording, never as a failure.
- **The port refreshes the cache**, whatever the outcome, so lists show what the
  server holds. State holds the intent as the user gave it (the tasks chosen), not
  a list read back from the cache.
- **A command ends with its store.** Leaving the subject forgets a request in
  flight or uncertain there. The request still completes and the port still
  refreshes the cache. If losing that is unacceptable, the command outlives the
  screen and belongs in the third row.

## Beyond the screen: an app-lifetime owner

Work the user expects to continue while they navigate (an upload, a long export)
is owned by a capability in `src/lib`, with an app-lifetime store that any screen
can observe. Navigation changes who is watching, never whether the work runs. See
[App state and persistence](app-state-and-persistence.md).

## Choosing between a mutation and a command slice

| Signal | Mutation | Command slice |
| --- | --- | --- |
| Who shows progress or the result | The hook that started it | A dialog, a status line, a toolbar, another panel |
| Other screen state changes with it | No | Yes: the selection, an open panel, a notice |
| Can start from more than one place | No | Yes: a menu, a drop, a shortcut |
| Needs a retry that repeats the same request | Rarely | Often |

When a mutation's hook starts passing its status to siblings, or two components
call the same mutation and try to agree, move it to a command slice.
