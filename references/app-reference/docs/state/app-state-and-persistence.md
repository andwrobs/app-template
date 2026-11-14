# App state and persistence

Part of the [app reference](../README.md), under [state](README.md).

State that outlives every screen, and the one way anything is kept across reloads.

## App-lifetime stores

A store is app-lifetime only when its state must survive leaving the screen: work
in progress (uploads), coordination across parts of the shell (a drag between
panes, a command palette), settings and device memory. It lives in a named
`src/lib` capability, never under `src/routes`, and is built once with Zustand's
`create`.

```ts
// Illustration: src/lib/uploads/upload.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type UploadState = { uploads: readonly Upload[] };
export type UploadActions = {
	actions: {
		add(files: readonly File[], destinationId: string): void;
		cancel(uploadId: string): void;
	};
};

export const initialState: UploadState = { uploads: [] };

export const useUploadStore = create<UploadState & UploadActions>()(
	devtools(
		(set, get) => {
			// Values nothing renders live here: private to the store, as long-lived
			// as it. Never at module scope, never in state.
			const controllers = new Map<string, AbortController>();
			return {
				...initialState,
				actions: {
					add(files, destinationId) { /* … */ },
					cancel(uploadId) {
						controllers.get(uploadId)?.abort();
					},
				},
			};
		},
		{ name: "app:uploads", enabled: import.meta.env.DEV },
	),
);

export const useUploadActions = () => useUploadStore((state) => state.actions);
```

- **Same shape as every store:** an `XState` type, `initialState`, and every
  function under one `actions` key that never changes.
- **It never knows about route stores.** A route store that needs something from
  it receives a port its provider builds; it is never handed the store.
- **Components subscribe with selector hooks.** Call `getState()` only inside an
  action, a loader or a port, never while rendering.
- **Tests reset it** with `setState(initialState)` before each case, because it is
  shared. This is the cost of a global store and the reason screens don't use one.
- **Adding one is a design decision.** Most state that feels global is server data
  (Query), a setting, or one screen's.

## One persistence path

Anything kept across reloads is a Zustand store wrapped in `persist`, with
`partialize` naming what is kept, over one storage adapter. No other module reads
or writes `localStorage` or `sessionStorage`.

```ts
// src/lib/preferences/viewer-storage.ts
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
```

Every persisted store:

- **lists what it keeps in `partialize`**, so adding state never persists it by
  accident;
- **sets `version`, and `migrate` brings older values forward** when the stored
  shape changes. Never rename a stored field without bumping the version;
- **validates in `merge`**, because stored text can be stale, from an older build,
  or edited by hand;
- **sets `skipHydration` and loads when the viewer is known.** Every key belongs to
  one viewer (`name:viewerId`), so two people who share a browser never see each
  other's values. The session sets the viewer once per page load
  ([session](../session.md)); each persisted store subscribes with
  `onViewerChange` and calls `persist.rehydrate()`;
- **loads again when another tab writes it** (`onStoredChange`), so two tabs don't
  disagree.

Until the viewer is known the store holds its initial state and writes nothing.
That window is the first page load before the session resolves, which the shell's
guard finishes before any screen renders.

A second persistence path (a module that calls `localStorage.setItem` beside a
store) means two things can disagree about a value and neither knows. One path
also means one place to change when storage moves.

## Settings

A setting is a choice the viewer would expect on another device: a view, a
density, whether a panel is left open. Settings live in `src/lib/preferences`.

The store is private to its folder:

```ts
// src/lib/preferences/settings.store.ts
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
```

Everything else imports the public module, which exports hooks for components and
ports for code that can't subscribe:

```ts
// src/lib/preferences/settings.ts
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
```

```tsx
// A component
const view = useTaskView();
const { setTaskView } = useSettingsActions();

// A loader
const order = orderFor(taskView.get());

// A route store's deps
dockedOpen: detailsOpen,
```

This boundary is what lets settings move. When they sync to a server they become
remote data, and by the ownership table Query owns them. The hooks become
`useQuery` with an optimistic mutation, the ports read the query cache, and no
consumer changes. A consumer that reached into the store object would break.

Never copy a setting into a route store "to initialize" it. The copy goes stale as
soon as anything else changes the setting, and two places then answer the same
question. Read it through a port when an action needs it, and with a hook when a
component renders it.

## Device memory

Device memory is what this browser remembers and no other should: which tree nodes
are expanded, recently opened items, a dismissed hint. It persists the same way,
through `viewerStorage`, but it never syncs, so it doesn't live with settings. It
lives in the `src/lib` capability that uses it.

The test that separates the two: **would the viewer be surprised not to find it on
their other device?** Yes is a setting. No is device memory.

Bound what you keep (the newest 500 ids, not all of them), and keep ids, never
copies of server data.

## What is never persisted

- Server data. The Query cache is the copy; persist it with Query's own persister
  if the app needs offline reads.
- Route store state. It ends with its subject.
- Anything secret: tokens, signed URLs, credentials.
