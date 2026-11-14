// The original Data Mode page is also our shared screen. Its preferences store
// registers browser listeners at import time, so exclude it from prerendering.
export { ProjectPage as ProjectView } from "~/routes/project/project.page";
