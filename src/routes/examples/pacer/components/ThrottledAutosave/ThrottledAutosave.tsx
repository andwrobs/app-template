import { ThrottledAutosaveView } from "./ThrottledAutosaveView";
import { useThrottledAutosave } from "./useThrottledAutosave";

export function ThrottledAutosave() {
	const props = useThrottledAutosave();
	return <ThrottledAutosaveView {...props} />;
}
