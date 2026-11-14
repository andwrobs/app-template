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
