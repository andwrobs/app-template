import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * A single-page app doesn't announce navigation. When the path changes, focus
 * moves to the new page's heading, so screen readers read it and the keyboard
 * continues from the top. Search-param changes and the first load leave focus
 * alone. Render it once, in the root.
 */
export function RouteFocus() {
	const { pathname } = useLocation();
	const previous = useRef(pathname);
	useEffect(() => {
		if (previous.current === pathname) return;
		previous.current = pathname;
		const target =
			document.querySelector<HTMLElement>("main h1") ??
			document.querySelector<HTMLElement>("main");
		if (!target) return;
		target.tabIndex = -1;
		target.focus({ preventScroll: true });
	}, [pathname]);
	return null;
}
