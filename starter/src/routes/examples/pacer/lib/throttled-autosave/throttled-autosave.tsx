import { ThrottledAutosaveView } from "./throttled-autosave-view";
import { useThrottledAutosave } from "./use-throttled-autosave";

export function ThrottledAutosave() {
	const props = useThrottledAutosave();
	return <ThrottledAutosaveView {...props} />;
}
