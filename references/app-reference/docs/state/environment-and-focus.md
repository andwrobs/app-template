# Environment and focus

Part of the [app reference](../README.md), under [state](README.md).

Two kinds of browser state that are neither data nor application state: what the
environment is (breakpoints, pointer type) and where focus should go next.

## Environment

One module calls `matchMedia`. Everything else asks it.

```ts
// src/lib/ui/media-query.ts
/**
 * The one module that reads CSS media queries. Where `matchMedia` is missing
 * (some test environments) a query reads as `unsupported` and never changes.
 */
export function matchesMedia(query: string, unsupported = false): boolean {
	return window.matchMedia?.(query).matches ?? unsupported;
}

/** Calls `onChange` when `query` starts or stops matching; returns the unsubscribe. */
export function subscribeToMedia(
	query: string,
	onChange: (matches: boolean) => void,
): () => void {
	const list = window.matchMedia?.(query);
	if (!list) return () => {};
	const listener = () => onChange(list.matches);
	list.addEventListener("change", listener);
	return () => list.removeEventListener("change", listener);
}
```

A component that renders by a breakpoint uses a hook over `useSyncExternalStore`,
which reads the value during render and can't show a stale one:

```ts
// src/lib/ui/use-media-query.ts
import { useCallback, useSyncExternalStore } from "react";
import { matchesMedia, subscribeToMedia } from "./media-query";

/** Whether `query` matches now, for components that render by it. */
export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(onChange: () => void) => subscribeToMedia(query, onChange),
		[query],
	);
	return useSyncExternalStore(subscribe, () => matchesMedia(query));
}
```

A route store gets a port, and follows the read-through rule:

- If an action only needs the current value, it calls the port at that moment and
  state holds no copy.
- If a change in the value is itself a transition (crossing a breakpoint closes a
  drawer), the slice keeps the value in state and subscribes in `start()`:

```ts
// The slice's deps
layout: {
	docked(): boolean;
	onDockedChange(listener: (docked: boolean) => void): () => void;
};

// The slice
return {
	actions,
	start: () => layout.onDockedChange((docked) => set(changeLayout(get(), docked), "changeLayout")),
};

// The provider passes
layout: {
	docked: () => matchesMedia(dockedLayout),
	onDockedChange: (listener) => subscribeToMedia(dockedLayout, listener),
},
```

The store's initial state reads the port once (`initialDetails(deps.layout.docked())`),
so the first render is right. Don't pass an environment value as an argument to
actions: every caller then has to know it, and two callers can disagree.

The same shape fits other environment state (online status, page visibility, a
reduced-motion preference): one adapter module, a hook for components, a port for
stores.

## Focus scope

Most focus needs no state. A native `<dialog>`, and overlay components from a
library such as React Aria, return focus to their trigger on close. A target only
one hook uses is a `useRef` in that hook.

A focus scope is for the remaining case: capabilities of one screen share focus
targets. A panel closes and focus should return to whatever opened it, which might
be a toolbar button, a row's button or a menu item, each in a different capability;
and if that element is gone, to a fallback that is always there.

DOM nodes don't belong in a store. They aren't serializable, they pass through
devtools, and writing them means changing the store outside an action. The store
keeps a serializable intent (`focusRequest: "return"`), and the scope keeps the
elements.

```tsx
// src/lib/focus/focus-scope.tsx
import { createContext, type ReactNode, use, useState } from "react";

/** The focus targets one screen's capabilities share, by name. */
export type FocusScope<Name extends string> = {
	/** A stable callback ref: `ref={focus.ref("toolbarToggle")}`. */
	ref(name: Name): (element: HTMLElement | null) => void;
	/** Records an element that isn't attached by `ref`, such as whatever was pressed last. */
	remember(name: Name, element: HTMLElement): void;
	forget(name: Name): void;
	/** Focuses the first named element still on the page; says whether one took focus. */
	restore(...names: Name[]): boolean;
};

function createScope<Name extends string>(): FocusScope<Name> {
	const elements = new Map<Name, HTMLElement>();
	const refs = new Map<Name, (element: HTMLElement | null) => void>();
	return {
		ref(name) {
			let ref = refs.get(name);
			if (!ref) {
				ref = (element) => {
					if (element) elements.set(name, element);
					else elements.delete(name);
				};
				refs.set(name, ref);
			}
			return ref;
		},
		remember: (name, element) => void elements.set(name, element),
		forget: (name) => void elements.delete(name),
		restore(...names) {
			for (const name of names) {
				const element = elements.get(name);
				if (element?.isConnected) {
					element.focus();
					return true;
				}
			}
			return false;
		},
	};
}

/** Declares a screen's focus scope. Render `Provider` inside the route store's. */
export function createFocusScope<Name extends string>() {
	const Context = createContext<FocusScope<Name> | null>(null);

	function Provider({ children }: { children: ReactNode }) {
		const [scope] = useState(() => createScope<Name>());
		return <Context value={scope}>{children}</Context>;
	}

	function useFocusScope(): FocusScope<Name> {
		const scope = use(Context);
		if (!scope) throw new Error("A focus scope was used outside its Provider.");
		return scope;
	}

	return { Provider, useFocusScope };
}
```

| Call | Does |
| --- | --- |
| `focus.ref(name)` | A stable callback ref to attach: `ref={focus.ref("detailsToggle")}` |
| `focus.remember(name, element)` | Records an element that isn't attached by `ref`, such as whatever was pressed last |
| `focus.restore(...names)` | Focuses the first named element still on the page; says whether one took focus |
| `focus.forget(name)` | Clears a remembered element |

Declare the scope in the screen's store file, with the names as a union, and
render its provider inside the store's so both share a key and a lifetime:

```ts
export const ProjectFocus = createFocusScope<"detailsOpener" | "detailsToggle">();
```

```tsx
<ProjectStoreProvider key={projectId} create={…}>
	<ProjectFocus.Provider>{children}</ProjectFocus.Provider>
</ProjectStoreProvider>
```

The flow has three parts:

1. **The trigger records itself and acts.** `focus.remember("detailsOpener",
   trigger)`, then `details.toggle()`.
2. **The transition records the intent.** `closeDetails` sets
   `focusRequest: "return"`. It is plain data, so it is testable.
3. **One lifecycle hook carries it out** after the close commits, when the page is
   interactive again. It claims the request, so it runs once:

```ts
export function useDetailsFocusReturn() {
	const returning = useProjectStore((project) => project.details.focusRequest === "return");
	const { details } = useProjectActions();
	const focus = ProjectFocus.useFocusScope();
	useEffect(() => {
		if (!returning || details.claimFocus() !== "return") return;
		focus.restore("detailsOpener", "detailsToggle");
		focus.forget("detailsOpener");
	}, [details, focus, returning]);
}
```

`restore` takes the targets in order of preference and skips any that left the
page, so the always-present toolbar button is the fallback.
