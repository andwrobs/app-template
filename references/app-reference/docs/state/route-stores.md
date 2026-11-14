# Route stores

Part of the [app reference](../README.md), under [state](README.md).

A route store holds one screen's shared client state for one subject. It is the
answer when two capabilities of a screen read the same state, or when an action in
one capability must change another's.

See [State](README.md) for where it sits among the other owners.

## Lifetime: keyed by the subject

The store is created when its provider mounts and dropped when it unmounts. The
route keys the provider by the subject's id, so React unmounts everything under it
and mounts it again when the subject changes:

```tsx
<ProjectStoreProvider key={projectId} create={() => createProjectStore(deps)}>
```

This is the whole lifetime model, and it removes three things that otherwise grow:

- **No reset.** A new subject gets a new store. There is no `reset()` to keep in
  step with every new piece of state, and tests never clean up a shared store.
- **No subject ids in state.** A selection doesn't record which project it belongs
  to, because the store it lives in belongs to one project.
- **No guards against late replies.** A reply that arrives after its store is gone
  changes a store nobody reads.

The cost is deliberate: component state, scroll position and an open drawer under
the provider start again with each subject. That is what a new subject means. Keep
anything that should survive (the app shell, navigation, a transfer tray) above the
provider.

Don't swap the store under a mounted tree instead of using `key`. Component state
under it (an open popover, a form draft) would still belong to the last subject.

## The store file

`<route>.store.ts` declares types, calls each slice's creator, and wires slices to
ports and to each other. It has no state key and no logic of its own, which keeps
it short and keeps two people working on different capabilities out of each
other's way.

```ts
// src/routes/project/project.store.ts
import { devtools } from "zustand/middleware";
import { createStore, type StoreApi } from "zustand/vanilla";
import { createFocusScope } from "~/lib/focus/focus-scope";
import {
	createRouteStoreContext,
	sliceScopes,
	startAll,
} from "~/lib/route-store/route-store";
import { initialArchive } from "./lib/archive/archive-flow";
import {
	type ArchiveActions,
	type ArchiveDeps,
	type ArchiveState,
	createArchiveSlice,
} from "./lib/archive/archive.slice";
import { initialDetails } from "./lib/details/details-state";
import {
	createDetailsSlice,
	type DetailsActions,
	type DetailsDeps,
	type DetailsState,
} from "./lib/details/details.slice";
import {
	createSelectionSlice,
	initialSelection,
	type SelectionActions,
	type SelectionState,
} from "./lib/selection/selection.slice";

export type ProjectState = {
	selection: SelectionState;
	details: DetailsState;
	archive: ArchiveState;
};

export type ProjectActions = {
	selection: SelectionActions;
	details: DetailsActions;
	archive: ArchiveActions;
};

type Project = ProjectState & {
	actions: ProjectActions;
	start(): () => void;
};

/** What the screen needs from outside. `project.provider.tsx` builds it. */
export type ProjectDeps = Pick<DetailsDeps, "dockedOpen" | "layout"> &
	Pick<ArchiveDeps, "sendArchive" | "newKey">;

export function createProjectStore(deps: ProjectDeps): StoreApi<Project> {
	return createStore<Project>()(
		devtools(
			(set, get) => {
				const scope = sliceScopes<ProjectState>(set, get);
				const selection = createSelectionSlice(scope("selection"));
				const archive = createArchiveSlice(scope("archive"), {
					sendArchive: deps.sendArchive,
					newKey: deps.newKey,
					archived: selection.actions.remove,
				});
				const details = createDetailsSlice(scope("details"), {
					dockedOpen: deps.dockedOpen,
					layout: deps.layout,
					startArchive: archive.actions.start,
				});
				return {
					selection: initialSelection,
					details: initialDetails(deps.layout.docked()),
					archive: initialArchive,
					actions: {
						selection: selection.actions,
						details: details.actions,
						archive: archive.actions,
					},
					start: startAll(selection, details, archive),
				};
			},
			{ name: "app:project", enabled: import.meta.env.DEV },
		),
	);
}

export const {
	Provider: ProjectStoreProvider,
	useStore: useProjectStore,
	useActions: useProjectActions,
} = createRouteStoreContext<Project>("Project");

/** The focus targets the screen's capabilities share. */
export const ProjectFocus = createFocusScope<"detailsOpener" | "detailsToggle">();
```

The shape is always the same:

- **State keys are slice names.** `state.selection`, `state.details`,
  `state.archive`.
- **`actions`** has the same keys and never changes, so a component that only acts
  never re-renders.
- **`start`** exists when a slice subscribes to something. The provider calls it in
  one effect and calls what it returns on unmount.
- **`devtools`** wraps the creator, enabled only in development. Every change shows
  as `slice/action`.

A component reads with a selector and acts through its capability's actions:

```tsx
const selected = useProjectStore((project) => project.selection.ids);
const { archive } = useProjectActions(); // never re-renders
<Button onPress={() => archive.start([...selected])}>Archive</Button>
```

Select the smallest value you render. A selector that returns a new object or array
each time re-renders on every store change; select fields separately, or wrap the
selector with `useShallow` from `zustand/react/shallow`.

## The provider builds the ports

`<route>.provider.tsx` is the store's composition root: the only place that knows
both what the store needs and who provides it. The page renders it around
everything that reads the store.

```tsx
// src/routes/project/project.provider.tsx
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { classifyFailure } from "~/lib/api/api-error";
import { detailsOpen } from "~/lib/preferences/settings";
import { taskKeys } from "~/lib/tasks/tasks.queries";
import { matchesMedia, subscribeToMedia } from "~/lib/ui/media-query";
import { getTaskService } from "~/services";
import {
	createProjectStore,
	type ProjectDeps,
	ProjectFocus,
	ProjectStoreProvider,
} from "./project.store";

const dockedLayout = "(min-width: 1100px)";

/** Every port the store needs, built from the real services, cache, settings and browser. */
function projectDeps(queryClient: QueryClient, projectId: string): ProjectDeps {
	return {
		newKey: () => crypto.randomUUID(),
		async sendArchive(intent) {
			try {
				const { archived } = await getTaskService().archive(intent);
				return { status: "done", archived };
			} catch (error) {
				return classifyFailure(error);
			} finally {
				await queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
			}
		},
		dockedOpen: detailsOpen,
		layout: {
			docked: () => matchesMedia(dockedLayout),
			onDockedChange: (listener) => subscribeToMedia(dockedLayout, listener),
		},
	};
}

/**
 * The store's composition root. One store and one focus scope per project:
 * another project is another mount of everything inside.
 */
export function ProjectProvider({
	projectId,
	children,
}: {
	projectId: string;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	return (
		<ProjectStoreProvider
			key={projectId}
			create={() => createProjectStore(projectDeps(queryClient, projectId))}
		>
			<ProjectFocus.Provider>{children}</ProjectFocus.Provider>
		</ProjectStoreProvider>
	);
}
```

`create` runs once per mount. React may run it twice in development (StrictMode),
so a store creator has no side effects: no subscriptions, no requests, no timers.
Those start in `start()`.

## Slices

A slice is one capability's part of the store, in
`lib/<capability>/<capability>.slice.ts`.

- **One key.** It exports one state type, its initial value (or a function of what
  it reads at creation), one actions type and one deps type. It reads and writes
  only its own key, through the scope it is given.
- **Pure transitions beside it.** The rules live in a sibling module of pure
  functions that take the slice's state and an intent and return the next state.
  The slice applies them. This is where most tests go.
- **Nothing that reaches out.** A slice imports types and pure functions from its
  own capability and from domain modules. It never imports another slice, a store,
  a service, the Query client or a browser adapter. What it needs arrives in `deps`.
- **Other capabilities are callbacks.** `archived(ids)` and `startArchive(ids)` are
  deps like any other; the store passes another slice's action. A user intent that
  spans capabilities belongs to the slice where the user starts it.

The transitions:

```ts
// src/routes/project/lib/details/details-state.ts
// Pure transitions for the details panel: a docked column on a wide screen,
// a drawer on a narrow one. Whether the docked column is open is a setting,
// so it isn't here.

export type DetailsState = {
	/** The screen is wide enough for the docked column. */
	docked: boolean;
	/** The drawer is open; meaningful only when not docked. */
	drawerOpen: boolean;
	/** Focus the panel owes: its heading after opening, the opener after closing. */
	focusRequest: "heading" | "return" | null;
};

export const initialDetails = (docked: boolean): DetailsState => ({
	docked,
	drawerOpen: false,
	focusRequest: null,
});

export const openDetails = (state: DetailsState): DetailsState => ({
	...state,
	drawerOpen: !state.docked,
	focusRequest: "heading",
});

export const closeDetails = (state: DetailsState): DetailsState => ({
	...state,
	drawerOpen: false,
	focusRequest: "return",
});

/** Crossing the breakpoint ends a drawer for good. */
export const changeLayout = (state: DetailsState, docked: boolean): DetailsState =>
	state.docked === docked ? state : { docked, drawerOpen: false, focusRequest: null };

export const focusClaimed = (state: DetailsState): DetailsState =>
	state.focusRequest ? { ...state, focusRequest: null } : state;
```

The slice that applies them:

```ts
// src/routes/project/lib/details/details.slice.ts
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
```

Three things in it are the pattern:

- `toggle` asks the setting whether the docked column is open at the moment it
  runs. The store holds no copy of the setting.
- `archive` is an intent that spans two capabilities. It belongs here because the
  user starts it in the panel, and it reaches Archive through a callback.
- `start` follows the breakpoint, because crossing it is a transition (the drawer
  ends). Nothing outside the slice can call `changeLayout`.

A simple slice needs no transition module:

```ts
// src/routes/project/lib/selection/selection.slice.ts
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
```

### What may enter a slice

State enters the route store on one test: **two capabilities read it, or an action
in another capability must change it.** A dialog only its own trigger opens keeps
its open state in its component. A filter only the list reads stays in the list's
hook, or in the URL if Back should restore it. Without this test the store becomes
the place everything goes because it is there.

## Ports

A port is a function, or a small object of functions, that gives a store one thing
from outside. The slice that uses it declares its type, named for the need and not
for the provider.

| The store needs | Port | The provider passes |
| --- | --- | --- |
| To send a request and refresh what it touched | `sendArchive(intent): Promise<SettledArchive>` | A closure over the service and the Query client |
| A current outside value, at the moment of an action | `dockedOpen.get()` | A port the value's owner exports |
| To change an outside value | `dockedOpen.set(open)` | The same port |
| To react when an outside value changes | `layout.onDockedChange(listener)` | A closure over the adapter |
| Randomness or time | `newKey()`, `now()` | `crypto.randomUUID`, `Date.now` |

- **Functions, not objects.** Passing a Query client, a service or another store
  hands over everything it can do and ties the slice to its shape. When the
  provider changes (a setting moves from local storage to the server), a port's
  two functions are reimplemented in one place and no slice changes.
- **A port that sends never rejects.** It resolves to a result the transitions can
  switch on: done, failed with a reason, or uncertain.
- **Read through unless the store must react.** If an action only needs the
  current value, it calls the port then, and state holds no copy; the component
  that renders the value subscribes to its owner with a hook. A store mirrors an
  outside value only when a change in it is itself a transition, and then it
  subscribes in `start()`.

A feature hook joins the two sides for rendering. It subscribes to the store for
screen state and to the setting's owner for the setting:

```ts
// src/routes/project/lib/details/use-details.ts
import { useEffect } from "react";
import { useDetailsOpen } from "~/lib/preferences/settings";
import { ProjectFocus, useProjectActions, useProjectStore } from "../../project.store";

/** What the details panel shows and how to open or close it. */
export function useDetails() {
	const { docked, drawerOpen } = useProjectStore((project) => project.details);
	// Read through: the setting's owner renders it; the store holds no copy.
	const dockedOpen = useDetailsOpen();
	const { details } = useProjectActions();
	const focus = ProjectFocus.useFocusScope();
	return {
		docked,
		open: docked ? dockedOpen : drawerOpen,
		/** Whatever was pressed is where focus comes back to. */
		toggle(trigger: HTMLElement) {
			focus.remember("detailsOpener", trigger);
			details.toggle();
		},
		close: details.close,
	};
}

/** Run once on the page: after a close commits, focus returns to what opened the panel. */
export function useDetailsFocusReturn() {
	const returning = useProjectStore(
		(project) => project.details.focusRequest === "return",
	);
	const { details } = useProjectActions();
	const focus = ProjectFocus.useFocusScope();
	useEffect(() => {
		if (!returning || details.claimFocus() !== "return") return;
		focus.restore("detailsOpener", "detailsToggle");
		focus.forget("detailsOpener");
	}, [details, focus, returning]);
}
```

## The kit

One module builds every route store, so no store file touches React context.

| Export | Does |
| --- | --- |
| `createRouteStoreContext<T>(name)` | Returns `Provider`, `useStore(selector)` and `useActions()`. `Provider` takes `create`, calls it once when it mounts, runs the store's `start()` in one effect and its stop function on unmount. |
| `sliceScopes<State>(set, get)` | Returns `scope(key)`, which gives a slice `get()` and `set(next, action)` for its own key. `set` names the change `key/action` in devtools and does nothing when `next` is the current value. |
| `startAll(...slices)` | Combines the slices' `start` functions into the store's. |
| `SliceScope<S>`, `Slice<Actions>` | What a slice creator takes and returns. |

`sliceScopes` is called once with the state type so that each `scope("key")` infers
its slice's type from the key alone.

```tsx
// src/lib/route-store/route-store.tsx
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { type StoreApi, useStore } from "zustand";

/** What every route store holds beside its slices' state. */
export type RouteStoreShape = {
	/** One key per slice. The object never changes. */
	actions: object;
	/** Starts the store's subscriptions; returns the function that stops them. */
	start?: () => () => void;
};

/**
 * The context, provider and hooks for one route store. `Provider` creates the
 * store when it mounts and drops it when it unmounts, so give it a `key` naming
 * what the store describes.
 */
export function createRouteStoreContext<T extends RouteStoreShape>(name: string) {
	const Context = createContext<StoreApi<T> | null>(null);

	function Provider({
		create,
		children,
	}: {
		create: () => StoreApi<T>;
		children: ReactNode;
	}) {
		const [store] = useState(create);
		useEffect(() => store.getState().start?.(), [store]);
		return <Context value={store}>{children}</Context>;
	}

	function useRouteStore<U>(select: (state: T) => U): U {
		const store = use(Context);
		if (!store) throw new Error(`The ${name} store was used outside its Provider.`);
		return useStore(store, select);
	}

	/** Every action, grouped by slice. Reading it never re-renders. */
	const useActions = (): T["actions"] => useRouteStore((state) => state.actions);

	return { Provider, useStore: useRouteStore, useActions };
}

/** A slice's view of the store: its own key, and nothing else. */
export type SliceScope<S> = {
	get(): S;
	/** Replaces the slice's state. `action` names the change in devtools. */
	set(next: S, action: string): void;
};

/** What a slice creator returns. */
export type Slice<Actions> = {
	actions: Actions;
	start?: () => () => void;
};

type NamedSet<State> = (
	partial: Partial<State>,
	replace?: false,
	action?: string,
) => void;

/** Binds the store's state type once, so `scope("key")` infers each slice's type. */
export function sliceScopes<State extends object>(
	set: NamedSet<State>,
	get: () => State,
) {
	return function scope<K extends keyof State & string>(
		key: K,
	): SliceScope<State[K]> {
		return {
			get: () => get()[key],
			set(next, action) {
				if (Object.is(get()[key], next)) return;
				set({ [key]: next } as unknown as Partial<State>, false, `${key}/${action}`);
			},
		};
	};
}

/** Combines the slices' `start` functions into the store's. */
export function startAll(...slices: readonly { start?: () => () => void }[]) {
	return () => {
		const stops = slices.flatMap((slice) => (slice.start ? [slice.start()] : []));
		return () => {
			for (const stop of stops) stop();
		};
	};
}
```

## Tests

- **Transitions:** call the pure functions and assert what they return. No store,
  no React.
- **The store:** build one with `createXStore` and plain functions for ports, drive
  its actions, and assert state and what the ports were called with. Each test
  builds its own store, so nothing is shared and nothing is reset.
- **Hooks and screens:** render and assert what the user sees.

```ts
// src/routes/project/project.store.test.ts
import { expect, test, vi } from "vitest";
import type { SettledArchive } from "./lib/archive/archive-flow";
import { createProjectStore, type ProjectDeps } from "./project.store";

function build(overrides: Partial<ProjectDeps> = {}) {
	let open = false;
	const deps: ProjectDeps = {
		newKey: () => "key-1",
		sendArchive: vi.fn(async (): Promise<SettledArchive> => ({ status: "uncertain" })),
		dockedOpen: { get: () => open, set: (next) => void (open = next) },
		layout: { docked: () => true, onDockedChange: () => () => {} },
		...overrides,
	};
	return { store: createProjectStore(deps), deps };
}

test("a retry sends the same key, and archived tasks leave the selection", async () => {
	const sendArchive = vi
		.fn<ProjectDeps["sendArchive"]>()
		.mockResolvedValueOnce({ status: "uncertain" })
		.mockResolvedValueOnce({ status: "done", archived: ["a"] });
	const { store } = build({ sendArchive });
	const { selection, archive } = store.getState().actions;

	selection.replace(["a", "b"]);
	archive.start(["a"]);
	archive.confirm();
	await vi.waitFor(() =>
		expect(store.getState().archive.request.status).toBe("uncertain"),
	);
	archive.confirm();
	await vi.waitFor(() => expect(store.getState().archive.open).toBe(false));

	expect(sendArchive.mock.calls.map(([intent]) => intent.key)).toEqual(["key-1", "key-1"]);
	expect([...store.getState().selection.ids]).toEqual(["b"]);
});
```
