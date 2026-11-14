import { useNavigation } from "react-router";

/**
 * The one sign that a page is loading. The page on screen stays until the
 * next one is ready, so there is nothing else to show. CSS delays it, so a
 * fast navigation shows nothing.
 */
export function NavigationProgress() {
	const { state } = useNavigation();
	if (state === "idle") return null;
	return <div aria-label="Loading page" className="navigation-progress" role="progressbar" />;
}
