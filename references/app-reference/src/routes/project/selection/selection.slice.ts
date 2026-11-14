import type { Slice, SliceScope } from "~/lib/route-store/route-store";

export type SelectionState = { ids: ReadonlySet<string> };

export type SelectionActions = {
	replace(ids: Iterable<string>): void;
	clear(): void;
	/** Drops tasks that left the page. */
	remove(ids: readonly string[]): void;
};

export const initialSelection: SelectionState = { ids: new Set() };

export function createSelectionSlice({
	get,
	set,
}: SliceScope<SelectionState>): Slice<SelectionActions> {
	return {
		actions: {
			replace: (ids) => set({ ids: new Set(ids) }, "replace"),
			clear: () => set(initialSelection, "clear"),
			remove(ids) {
				const kept = [...get().ids].filter((id) => !ids.includes(id));
				if (kept.length < get().ids.size) set({ ids: new Set(kept) }, "remove");
			},
		},
	};
}
