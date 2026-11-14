import { createApiClient } from "~/lib/api/api";
import { createDemoNoteService } from "~/lib/demo/note.service";
import { createDemoProjectRequestService } from "~/lib/demo/project-request.service";
import { createProjectsService } from "~/lib/demo/projects.service";
import { createTaskSearchService } from "~/lib/demo/task-search.service";
import { createTasksService } from "~/lib/demo/tasks.service";
import { once } from "~/lib/once/once";

// The composition root. Each export is a getter that builds its service on the
// first call, in dependency order; nothing is built when this module loads and
// nothing else imports a factory. Swap an implementation (a fake server,
// fixture data) here, not in its consumers. Services for the app's API share
// one client:
//
//   const getApi = once(() => createApiClient({ baseUrl: env.VITE_API_URL }));
//   export const getLedgerService = once(() =>
//     createLedgerService({ api: getApi() }),
//   );
//   export const getBillingService = once(() =>
//     createBillingService({ api: getApi(), ledger: getLedgerService() }),
//   );

// Services for src/routes/examples/. The demo client reads public/demo.
const getDemoApi = once(() => createApiClient({ baseUrl: "/demo" }));
export const getProjectsService = once(() =>
	createProjectsService({ api: getDemoApi() }),
);
export const getTasksService = once(() =>
	createTasksService({ api: getDemoApi() }),
);
export const getTaskSearchService = once(() =>
	createTaskSearchService({ api: getDemoApi() }),
);
export const getProjectRequestService = once(createDemoProjectRequestService);
export const getNoteService = once(createDemoNoteService);
