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
