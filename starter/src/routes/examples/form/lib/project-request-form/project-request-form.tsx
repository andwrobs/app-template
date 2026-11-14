import { ProjectRequestFormView } from "./project-request-form-view";
import { useProjectRequestForm } from "./use-project-request-form";

export function ProjectRequestForm() {
	const props = useProjectRequestForm();
	return <ProjectRequestFormView {...props} />;
}
