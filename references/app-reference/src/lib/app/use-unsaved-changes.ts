import { useCallback } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

/**
 * Holds the user on the page while `dirty`. A navigation inside the app waits
 * for `leave` or `stay`; closing or reloading the tab gets the browser's own
 * prompt.
 */
export function useUnsavedChanges(dirty: boolean) {
	const blocker = useBlocker(dirty);
	useBeforeUnload(
		useCallback(
			(event) => {
				if (dirty) event.preventDefault();
			},
			[dirty],
		),
	);
	return {
		/** A navigation is waiting: ask the user. */
		asking: blocker.state === "blocked",
		leave: () => blocker.proceed?.(),
		stay: () => blocker.reset?.(),
	};
}
