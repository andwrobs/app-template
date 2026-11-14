import type { Slice, SliceScope } from "~/lib/route-store/route-store";
import {
	changeLayout,
	closeDetails,
	type DetailsState,
	focusClaimed,
	openDetails,
} from "./details-state";

export type { DetailsState };

export type DetailsActions = {
	open(): void;
	close(): void;
	toggle(): void;
	/** Archive from the panel: a drawer would sit above the dialog, so it gives way. */
	archive(taskIds: readonly string[]): void;
	/** The focus the panel owes, if any; asking clears it. */
	claimFocus(): DetailsState["focusRequest"];
};

export type DetailsDeps = {
	/** The viewer's setting: is the docked column open? */
	dockedOpen: { get(): boolean; set(open: boolean): void };
	/** The docked breakpoint. */
	layout: {
		docked(): boolean;
		onDockedChange(listener: (docked: boolean) => void): () => void;
	};
	/** Opens the archive dialog for these tasks. */
	startArchive(taskIds: readonly string[]): void;
};

export function createDetailsSlice(
	{ get, set }: SliceScope<DetailsState>,
	{ dockedOpen, layout, startArchive }: DetailsDeps,
): Slice<DetailsActions> {
	const actions: DetailsActions = {
		open() {
			if (get().docked) dockedOpen.set(true);
			set(openDetails(get()), "open");
		},
		close() {
			if (get().docked) dockedOpen.set(false);
			set(closeDetails(get()), "close");
		},
		toggle() {
			const { docked, drawerOpen } = get();
			if (docked ? dockedOpen.get() : drawerOpen) actions.close();
			else actions.open();
		},
		archive(taskIds) {
			if (!get().docked) set(closeDetails(get()), "close");
			startArchive(taskIds);
		},
		claimFocus() {
			const { focusRequest } = get();
			set(focusClaimed(get()), "claimFocus");
			return focusRequest;
		},
	};
	return {
		actions,
		// A change of layout is a transition here, so the store follows it.
		start: () =>
			layout.onDockedChange((docked) =>
				set(changeLayout(get(), docked), "changeLayout"),
			),
	};
}
