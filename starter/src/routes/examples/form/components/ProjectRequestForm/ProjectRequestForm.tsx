import { ProjectRequestFormView } from "./ProjectRequestFormView";
import { useProjectRequestForm } from "./useProjectRequestForm";

export function ProjectRequestForm() {
	const props = useProjectRequestForm();
	return <ProjectRequestFormView {...props} />;
}
