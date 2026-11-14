import { type TaskView, useSettingsStore } from "./settings.store";

export type { TaskView };

// Hooks, for components.
export const useTaskView = () => useSettingsStore((settings) => settings.taskView);
export const useDetailsOpen = () =>
	useSettingsStore((settings) => settings.detailsOpen);
export const useSettingsActions = () =>
	useSettingsStore((settings) => settings.actions);

// Ports, for loaders and route stores, which read at a moment instead of subscribing.
export const taskView = {
	get: () => useSettingsStore.getState().taskView,
};
export const detailsOpen = {
	get: () => useSettingsStore.getState().detailsOpen,
	set: (open: boolean) => useSettingsStore.getState().actions.setDetailsOpen(open),
};
