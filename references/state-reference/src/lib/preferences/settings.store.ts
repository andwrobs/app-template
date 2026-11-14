import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { viewerStorage } from "./viewer-storage";

export type TaskView = "list" | "board";

export type SettingsState = {
	taskView: TaskView;
	/** The docked details column is open. */
	detailsOpen: boolean;
};

export type SettingsActions = {
	actions: {
		setTaskView(view: TaskView): void;
		setDetailsOpen(open: boolean): void;
	};
};

export const initialState: SettingsState = { taskView: "list", detailsOpen: false };

/** Private to this folder: everything else imports `./settings`. */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
	devtools(
		persist(
			(set) => ({
				...initialState,
				actions: {
					setTaskView: (taskView) => set({ taskView }, false, "setTaskView"),
					setDetailsOpen: (detailsOpen) =>
						set({ detailsOpen }, false, "setDetailsOpen"),
				},
			}),
			{
				name: "app:settings:v1",
				version: 1,
				storage: createJSONStorage(() => viewerStorage),
				// Only what is named here survives a reload.
				partialize: ({ taskView, detailsOpen }) => ({ taskView, detailsOpen }),
				// Stored text can be stale or edited: accept known values, default the rest.
				merge: (persisted, current) => {
					const stored = persisted as Partial<Record<keyof SettingsState, unknown>> | null;
					return {
						...current,
						taskView: stored?.taskView === "board" ? "board" : "list",
						detailsOpen: stored?.detailsOpen === true,
					};
				},
			},
		),
		{ name: "app:settings", enabled: import.meta.env.DEV },
	),
);
