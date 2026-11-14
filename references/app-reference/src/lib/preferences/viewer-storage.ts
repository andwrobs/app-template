import type { StateStorage } from "zustand/middleware";

// The one module that touches `localStorage`. Every key belongs to one
// viewer, so two people sharing a browser never see each other's values.

let viewerId: string | null = null;
const listeners = new Set<() => void>();

const keyFor = (name: string) => `${name}:${viewerId}`;

/**
 * Says whose storage this is. Called once per page load, when the session is
 * known; persisted stores then load that viewer's values.
 */
export function setViewer(id: string) {
	if (id === viewerId) return;
	viewerId = id;
	for (const listener of listeners) listener();
}

export function onViewerChange(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Another tab wrote `name`. */
export function onStoredChange(name: string, listener: () => void): () => void {
	const onStorage = (event: StorageEvent) => {
		if (viewerId && event.key === keyFor(name)) listener();
	};
	window.addEventListener("storage", onStorage);
	return () => window.removeEventListener("storage", onStorage);
}

/**
 * Storage for `persist`. Before the viewer is known it holds nothing. Storage
 * can also be missing or throw (private windows, blocked site data); a value
 * then lasts only for this visit.
 */
export const viewerStorage: StateStorage = {
	getItem: (name) => {
		if (!viewerId) return null;
		try {
			return localStorage.getItem(keyFor(name));
		} catch {
			return null;
		}
	},
	setItem: (name, value) => {
		if (!viewerId) return;
		try {
			localStorage.setItem(keyFor(name), value);
		} catch {
			// Not remembering is acceptable.
		}
	},
	removeItem: (name) => {
		if (!viewerId) return;
		try {
			localStorage.removeItem(keyFor(name));
		} catch {
			// Nothing to remove.
		}
	},
};
