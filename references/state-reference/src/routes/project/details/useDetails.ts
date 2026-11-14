import { useEffect } from "react";
import { useDetailsOpen } from "~/lib/preferences/settings";
import { ProjectFocus, useProjectActions, useProjectStore } from "../project.store";

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
