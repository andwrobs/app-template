import { createApiClient } from "~/lib/api/api";
import { createDemoProjectRequestService } from "~/routes/examples/form/project-request.service";
import { createDemoNoteService } from "~/routes/examples/pacer/note.service";
import { createTaskSearchService } from "~/routes/examples/pacer/task-search.service";
import { createProjectsService } from "~/routes/examples/query/projects.service";
import { createTasksService } from "~/routes/examples/table/tasks.service";

// The composition root. Every service is built once, here, in dependency order,
// and exported as an instance; nothing else imports a factory. Swap an
// implementation (a fake server, fixture data) here, not in its consumers.
// Services for the app's API share one client:
//
//   const api = createApiClient({ baseUrl: env.VITE_API_URL });
//   export const ledgerService = createLedgerService({ api });
//   export const billingService = createBillingService({ api, ledger: ledgerService });

// Services for src/routes/examples/, one line each. demoApi reads public/demo.
const demoApi = createApiClient({ baseUrl: "/demo" });
export const projectsService = createProjectsService({ api: demoApi });
export const tasksService = createTasksService({ api: demoApi });
export const taskSearchService = createTaskSearchService({ api: demoApi });
export const projectRequestService = createDemoProjectRequestService();
export const noteService = createDemoNoteService();
