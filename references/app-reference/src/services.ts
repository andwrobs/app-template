import { request } from "~/lib/api/api-client";
import { createSessionService } from "~/lib/session/session.service";
import { createTaskService } from "~/lib/tasks/tasks.service";

// The composition root for services: each is built once, here. Everything
// else imports these instances.
const api = { request };

export const sessionService = createSessionService(api);
export const taskService = createTaskService(api);
