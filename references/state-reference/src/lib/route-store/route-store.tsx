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
