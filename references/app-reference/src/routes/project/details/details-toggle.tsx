import { ProjectFocus } from "../project.store";
import { DetailsToggleView } from "./details-toggle-view";
import { useDetails } from "./use-details";

/** The connected component: the one place the hook meets the view. */
export function DetailsToggle() {
	const details = useDetails();
	const focus = ProjectFocus.useFocusScope();
	return (
		<DetailsToggleView
			onToggle={details.toggle}
			open={details.open}
			ref={focus.ref("detailsToggle")}
		/>
	);
}
