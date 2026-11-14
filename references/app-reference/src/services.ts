import { request } from "~/lib/api/api-client";
import { once } from "~/lib/once/once";
import { createSessionService } from "~/lib/session/session.service";
import { createTaskService } from "~/lib/tasks/tasks.service";

// The composition root for services. Each export is a getter that builds its
// service on the first call; nothing is built when this module loads.
// Everything else calls these getters.
const api = { request };

export const getSessionService = once(() => createSessionService(api));
export const getTaskService = once(() => createTaskService(api));
