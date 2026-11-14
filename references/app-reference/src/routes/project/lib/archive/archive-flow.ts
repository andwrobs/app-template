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
