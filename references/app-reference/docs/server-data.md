# Server data

This reference chooses TanStack Query as the owner of server data. This page
covers the path a request takes, how failures are named, how the cache is keyed
and refreshed, and how writes with one observer are done. This is an application
policy, not a restriction of React Router: Framework Mode can instead use native
loader data and actions as its data model.

Part of the [app reference](README.md). Writes that several capabilities observe
are [commands](state/commands.md).

## The path of a request

```text
component → query options or mutation → service → API client → fetch
```

Dependencies point one way. A component never calls a service; a service knows
nothing about Query, stores or React.

**The API client** is the only code that calls `fetch`. It resolves to data or
throws one error type.

```ts
// src/lib/api/api-client.ts
import { ApiError } from "./api-error";

/**
 * Sends one request. Resolves to the reply's data or throws one `ApiError`;
 * an abort passes through. A generated client can replace this as long as it
 * keeps that contract.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	let response: Response;
	try {
		response = await fetch(path, {
			credentials: "same-origin",
			...init,
			headers: { "Content-Type": "application/json", ...init.headers },
		});
	} catch (cause) {
		if (init.signal?.aborted) throw cause;
		throw new ApiError("network", undefined, { cause });
	}
	if (!response.ok) throw new ApiError("http", response.status);
	if (response.status === 204) return undefined as T;
	try {
		return (await response.json()) as T;
	} catch (cause) {
		throw new ApiError("invalid-response", response.status, { cause });
	}
}

export type ApiClient = { request: typeof request };
```

In a project with an API contract, generate the client and its types from the
contract and never edit the output. Keep the same rule: one error type out.

**A service** is a stateless set of functions, one per API call, built by a factory
from the client so a test can pass a fake.

```ts
// src/lib/tasks/tasks.service.ts
import type { ApiClient } from "~/lib/api/api-client";

export type Task = { id: string; name: string; starred: boolean };
export type TaskOrder = "name" | "due";

/** Stateless: every function is one API call. Knows nothing about Query or stores. */
export function createTaskService({ request }: ApiClient) {
	return {
		list: (projectId: string, order: TaskOrder, signal?: AbortSignal) =>
			request<Task[]>(`/api/projects/${projectId}/tasks?order=${order}`, { signal }),
		rename: (input: { taskId: string; name: string }) =>
			request<Task>(`/api/tasks/${input.taskId}`, {
				method: "PATCH",
				body: JSON.stringify({ name: input.name }),
			}),
		star: (input: { taskId: string; starred: boolean }) =>
			request<Task>(`/api/tasks/${input.taskId}`, {
				method: "PATCH",
				body: JSON.stringify({ starred: input.starred }),
			}),
		archive: (intent: { key: string; taskIds: readonly string[] }) =>
			request<{ archived: string[] }>("/api/tasks/archive", {
				method: "POST",
				headers: { "Idempotency-Key": intent.key },
				body: JSON.stringify({ taskIds: intent.taskIds }),
			}),
	};
}

export type TaskService = ReturnType<typeof createTaskService>;
```

**The composition root** builds each service once. Everything else imports the
instances.

```ts
// src/services.ts
import { request } from "~/lib/api/api-client";
import { createSessionService } from "~/lib/session/session.service";
import { createTaskService } from "~/lib/tasks/tasks.service";

// The composition root for services: each is built once, here. Everything
// else imports these instances.
const api = { request };

export const sessionService = createSessionService(api);
export const taskService = createTaskService(api);
```

## Errors

Every failed call is an `ApiError` with a kind. Code asks questions of it
(`isNotFound`, `isOffline`) and never inspects status codes itself.

```ts
// src/lib/api/api-error.ts
export type ApiErrorKind =
	/** No reply: offline, a dropped connection, a timeout. */
	| "network"
	/** The server replied with an error status. */
	| "http"
	/** The server replied with something this client can't read. */
	| "invalid-response";

/** The one error every service call throws. */
export class ApiError extends Error {
	constructor(
		readonly kind: ApiErrorKind,
		readonly status?: number,
		options?: ErrorOptions,
	) {
		super(status ? `API ${kind} ${status}` : `API ${kind}`, options);
		this.name = "ApiError";
	}
}

const statusOf = (error: unknown) =>
	error instanceof ApiError ? error.status : undefined;

export const isUnauthorized = (error: unknown) => statusOf(error) === 401;
export const isNotFound = (error: unknown) => statusOf(error) === 404;
export const isForbidden = (error: unknown) => statusOf(error) === 403;
export const isOffline = (error: unknown) =>
	error instanceof ApiError && error.kind === "network";

/** Worth one more try: no reply, or the server failed. Never a 4xx. */
export const isTransient = (error: unknown) =>
	error instanceof ApiError &&
	(error.kind === "network" || (error.status ?? 0) >= 500);

export type FailureReason = "invalid" | "forbidden" | "not-found" | "conflict" | "refused";

/**
 * How a write that threw should be shown. The server said no (a 4xx): failed,
 * and nothing changed. Anything else, it may have done the work: uncertain.
 */
export function classifyFailure(
	error: unknown,
): { status: "failed"; reason: FailureReason } | { status: "uncertain" } {
	const status = statusOf(error);
	if (status === undefined || status >= 500) return { status: "uncertain" };
	if (status === 400 || status === 422) return { status: "failed", reason: "invalid" };
	if (status === 403) return { status: "failed", reason: "forbidden" };
	if (status === 404) return { status: "failed", reason: "not-found" };
	if (status === 409) return { status: "failed", reason: "conflict" };
	return { status: "failed", reason: "refused" };
}
```

`classifyFailure` is the one rule for what a failed **write** means:

| What came back | Means | Show |
| --- | --- | --- |
| A 4xx | The server refused, and nothing changed | Failed, with the reason; the user can fix it and try again |
| No reply, a 5xx, or an unreadable reply | The server may or may not have done the work | Uncertain: say so, and offer to try again under the same idempotency key |

Treating an uncertain write as a failure invites the user to repeat something that
may have already happened. Every mutation and every command port uses this one
function, so the app answers the question the same way everywhere.

## The Query client

```ts
// src/lib/query/query-client.ts
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isTransient, isUnauthorized } from "~/lib/api/api-error";
import { sessionExpired } from "~/lib/session/sign-in-redirect";

// A 401 can arrive at any moment, not only while a page loads, so it is
// handled once, here. The session query is the exception: the shell's guard
// asks it on purpose and redirects itself.
function onError(error: unknown, key?: readonly unknown[]) {
	if (isUnauthorized(error) && key?.[0] !== "session") sessionExpired();
}

/**
 * Builds the app's Query client. `app.tsx` makes one and hands it to the
 * routes and the provider; each test makes its own.
 */
export function createQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => onError(error, query.queryKey),
		}),
		mutationCache: new MutationCache({ onError: (error) => onError(error) }),
		defaultOptions: {
			queries: {
				// Long enough that a loader and the page it feeds share one fetch.
				staleTime: 30_000,
				retry: (failures, error) => failures < 1 && isTransient(error),
			},
			// A write is retried by the user, under the same idempotency key.
			mutations: { retry: false },
		},
	});
}
```

- **In Data Mode, one client created in `app.tsx` and passed in.** Routes receive it in
  `RouteDeps` for `load` and `guard`; components use `useQueryClient()`, which
  returns the same one. Nothing imports a shared instance, so each test creates
  its own.
- **A `staleTime` above zero.** With zero, the loader fetches and the component
  mounting a moment later fetches again.
- **Retry reads once, and only when retrying could help.** A 404 will be a 404
  again.
- **Never retry writes automatically.** A retry is the user's decision, made with
  the result in front of them.
- **A 401 is handled here, once.** See [session](session.md).

### Framework Mode and the browser cache

To preserve this Query policy in Framework Mode, `clientLoader` obtains the same
browser QueryClient used by the provider in `root.tsx`, awaits
`ensureQueryData(options)`, and returns `null`. The page reads those options with
`useSuspenseQuery`. Do not create a client per loader invocation or import the
Data Mode `RouteDeps` factory into a Framework route module.

A server `loader` runs in a different environment and cannot directly warm the
browser's cache. For server-rendered Query data, create a client per server
request, dehydrate the needed cache data and hydrate the browser client before
its consumers render. Alternatively, use the loader's returned `loaderData` as
the owner. Do not maintain two independent copies of the same records.

Initial `clientLoader` execution depends on the rendering strategy and whether
the route also has a server loader. Configure hydration behavior deliberately;
see [Framework Mode routing](framework-routing.md) and the runnable
[Framework Mode example](../framework/README.md).

## Keys and options

Keys and query options live in `.queries.ts` files. A route's options sit in its
own `<route>.queries.ts`. Keys that more than one route or mutation needs sit in
the domain's file under `src/lib`. Keys are never written inline.

```ts
// src/lib/tasks/tasks.queries.ts
import type { TaskOrder } from "./tasks.service";

/**
 * Every key for tasks, from broad to narrow. Invalidating a key refreshes
 * everything under it, so a write names the broadest key it could have changed.
 * Shared here because more than one route reads tasks.
 */
export const taskKeys = {
	all: ["tasks"] as const,
	project: (projectId: string) => [...taskKeys.all, projectId] as const,
	list: (projectId: string, order: TaskOrder) =>
		[...taskKeys.project(projectId), "list", order] as const,
};
```

```ts
// src/routes/project/project.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { taskKeys } from "~/lib/tasks/tasks.queries";
import type { TaskOrder } from "~/lib/tasks/tasks.service";
import { taskService } from "~/services";

/** The project's tasks. The loader and the page both use it, so they share one cache entry. */
export function projectTasksOptions(projectId: string, order: TaskOrder) {
	return queryOptions({
		queryKey: taskKeys.list(projectId, order),
		queryFn: ({ signal }) => taskService.list(projectId, order, signal),
	});
}
```

- **Hierarchical keys.** `taskKeys.project(id)` is a prefix of every list and
  detail under that project, so one invalidation refreshes all of them.
- **Everything that changes the result is in the key**: the record, the order, the
  filter, the page. If a value changes what the server returns and isn't in the
  key, two different results share one cache entry.
- **`queryFn` passes Query's `signal`** to the service, so a query nobody is
  waiting for is cancelled.
- **Options live with their reader.** One route reads them: that route's
  `.queries.ts`. Several do: the domain's, beside the keys.
- **The file is `.queries.ts` even when it holds one query**, so it never needs
  renaming.

## Reading

| In | Use |
| --- | --- |
| A page, for Query data its Data Mode `load` or Framework `clientLoader` awaited | `useSuspenseQuery(options)` |
| A component, for data that may be absent or is secondary | `useQuery(options)`, or `useSuspenseQuery` under its own `<Suspense>` |
| A route's `load` | `queryClient.ensureQueryData(options)` ([routing](routing.md#loading-data)) |
| A Framework route's `clientLoader`, using Query | The same `ensureQueryData(options)` on the browser client's shared instance ([Framework Mode routing](framework-routing.md)) |
| Derived values | `select` in the options, or a pure function at the call site. Never a second piece of state. |
| Long lists | `useInfiniteQuery` with the server's cursor. Pages stay in the cache; the cursor is never copied out. |

Never copy query data into a store, component state or an effect. A copy is stale
the moment the cache refreshes.

## Writing: a mutation

A write that one hook starts and one hook shows is a mutation. Mutation hooks live
in the domain's `.mutations.ts`, beside its `.queries.ts`, so every place the
cache is refreshed after a write can be found by file name.

```ts
// src/lib/tasks/tasks.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "~/services";
import { taskKeys } from "./tasks.queries";
import type { Task, TaskOrder } from "./tasks.service";

/** Renames a task, then refreshes every list and detail in its project. */
export function useRenameTask(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: taskService.rename,
		// Whatever happened, show what the server holds.
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}

/**
 * Stars a task and shows it at once. Optimistic because it is one field, the
 * server rarely refuses, and putting it back is exact.
 */
export function useStarTask(projectId: string, order: TaskOrder) {
	const queryClient = useQueryClient();
	const key = taskKeys.list(projectId, order);
	return useMutation({
		mutationFn: taskService.star,
		async onMutate({ taskId, starred }) {
			// A refetch already in flight would overwrite the optimistic value.
			await queryClient.cancelQueries({ queryKey: key });
			const before = queryClient.getQueryData<Task[]>(key);
			queryClient.setQueryData<Task[]>(key, (tasks) =>
				tasks?.map((task) => (task.id === taskId ? { ...task, starred } : task)),
			);
			return { before };
		},
		onError: (_error, _input, context) => {
			queryClient.setQueryData(key, context?.before);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) }),
	});
}
```

A form that drives a mutation stays in its capability:

```ts
// src/routes/project/lib/rename/use-rename-form.ts
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { classifyFailure } from "~/lib/api/api-error";
import { useRenameTask } from "~/lib/tasks/tasks.mutations";
import type { Task } from "~/lib/tasks/tasks.service";

const schema = z.object({ name: z.string().trim().min(1, "Give the task a name.") });

/**
 * The rename form. The form owns the draft and its validation; the mutation
 * owns the request; this hook is the only place they meet.
 */
export function useRenameForm(projectId: string, task: Task, onRenamed: () => void) {
	const rename = useRenameTask(projectId);
	const form = useForm({
		defaultValues: { name: task.name },
		validators: { onSubmit: schema },
		async onSubmit({ value }) {
			// A failure stays in `rename.error`; the draft is kept so the user can retry.
			await rename.mutateAsync({ taskId: task.id, name: value.name.trim() });
			onRenamed();
		},
	});
	return {
		form,
		saving: rename.isPending,
		/** What to say about the last attempt, if it didn't work. */
		failure: rename.error ? classifyFailure(rename.error) : null,
	};
}
```

- **One submission owner.** The form validates and calls the mutation; nothing
  else submits. `saving` disables the button, which also blocks a double submit.
- **The form owns the draft, the mutation owns the request.** A failed save keeps
  the draft, and the view shows `failure` beside the form.
- **`onSettled` invalidates**, whether the write succeeded or not, because after
  an uncertain write the cache is the only way to find out what happened.

### Who refreshes the cache

The write does, and nothing else. A mutation invalidates in `onSettled`; a command
port invalidates in `finally`. Never invalidate from a component effect or after a
navigation.

Invalidate the broadest key the write could have changed. Refetching one list too
many costs a request. Missing one shows the user something false.

### Optimistic updates

Show a change before the server confirms it only when all three hold: it is one
field, the server almost never refuses it, and putting it back is exact.
`useStarTask` above is the shape.

Everything else shows pending. Optimistic edits to lists the server orders, pages
or filters are where the hard bugs live: the client has to predict where a renamed
row sorts, and whether it still matches the filter.

Apart from this and the write's own `onSettled`, nothing calls `setQueryData`.

## Rules in one list

1. Under this reference's data policy, Query is the only owner of server data.
2. One API client, one error type, one classifier for failed writes.
3. Services are stateless and built in one composition root.
4. Keys come from a factory, are hierarchical, and include everything that changes
   the result.
5. Data Mode `load` or Framework `clientLoader` warms the browser cache;
   components read it with the same options. Server loaders need a hydration path.
6. The write refreshes the cache, broadly.
7. Optimistic only for cheap, exact, rarely refused changes.
