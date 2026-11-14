import type { StateStorage } from "zustand/middleware";

/**
 * This browser's storage for what a viewer's stores persist: the one module
 * that touches `localStorage`. Storage can be missing or throw (private
 * windows, blocked site data); a value then lasts only for this visit.
 */
export const viewerStorage: StateStorage = {
	getItem: (name) => {
		try {
			return localStorage.getItem(name);
		} catch {
			return null;
		}
	},
	setItem: (name, value) => {
		try {
			localStorage.setItem(name, value);
		} catch {
			// Not remembering is acceptable.
		}
	},
	removeItem: (name) => {
		try {
			localStorage.removeItem(name);
		} catch {
			// Nothing to remove.
		}
	},
};
