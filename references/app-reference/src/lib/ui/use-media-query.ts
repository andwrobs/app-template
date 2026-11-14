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
