import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { onStoredChange, onViewerChange, viewerStorage } from "./viewer-storage";

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

const storageName = "app:settings";

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
				name: storageName,
				storage: createJSONStorage(() => viewerStorage),
				// Loaded below, once the viewer is known.
				skipHydration: true,
				// Only what is named here survives a reload.
				partialize: ({ taskView, detailsOpen }) => ({ taskView, detailsOpen }),
				// Bump when the stored shape changes, and bring old values forward.
				version: 2,
				migrate: (persisted, version) => {
					const stored = { ...(persisted as Record<string, unknown>) };
					// v1 called it `view`.
					if (version < 2) stored.taskView = stored.view;
					return stored;
				},
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
		{ name: storageName, enabled: import.meta.env.DEV },
	),
);

const load = () => void useSettingsStore.persist.rehydrate();
onViewerChange(load);
// Another tab changed a setting: show it here too.
onStoredChange(storageName, load);
