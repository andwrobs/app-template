---
name: new-route
description: Add a page or feature route to this app in its house style (route folder, title, a service built in the composition root, Query-backed clientLoader, encapsulated features with thin connected components, tests beside the code, routes.ts, and nav). Use whenever you add a screen; use react-router for other route work.
---

# New route

`AGENTS.md`, [code organization](../../../docs/code-organization.md), and
[data and forms](../../../docs/data-and-forms.md) hold the rules; this is the order to
apply them. Use the `react-router` skill for API details.

## Shape

```text
src/routes/<feature>/
  <feature>.route.tsx        # meta, clientLoader, default export
  <feature>.route.test.tsx
  <thing>.ts                 # Zod schema and types, if it loads data
  <thing>.service.ts         # ThingsService and createThingsService
  <thing>.service.test.ts
  <thing>.query.ts           # queryOptions calling the service instance
  components/<Name>/         # only for parts worth splitting out
    <Name>.tsx               # connected entry: binds private hook to view
    <Name>View.tsx            # renders state, emits intent
    use<Name>.ts             # owns workflow and library integration
    <Name>.test.tsx
    index.ts                 # exports the connected entry, not its internals
```

Import other features only through `src/lib`, never from another route's folder.

## Steps

1. **Ownership and data.** Name the feature owner and its public actions before
   adding behavior. Keep workflow transitions, URL/library adaptation, and side
   effects in its private hook or domain module. Use a thin connected entry point
   for a self-contained feature; routes compose these instead of assembling each
   child's hooks. Static pages need no controller, and simple subscriptions with no
   workflow need no artificial layer. In the minimal example below, a direct query
   subscription is sufficient.

   **Data** follows [services and state](../../../docs/services-and-state.md). Put the
   schema and types in `<thing>.ts`. In `<thing>.service.ts`, export `ThingsService`
   and `createThingsService({ api }: Deps)`, which calls
   `api.request(path, schema, { signal })`. In `src/services.ts`, build it once and
   export `thingsService`; if the file has no client yet, add
   `const api = createApiClient({ baseUrl: env.VITE_API_URL })`. In
   `<thing>.query.ts`, export `queryOptions` whose `queryFn` calls
   `thingsService.list({ signal })`.
2. **Route module.**

   ```tsx
   import { useQuery } from "@tanstack/react-query";
   import { pageTitle } from "~/lib/meta/title";
   import { queryClient } from "~/lib/query/client";
   import type { Route } from "./+types/things.route";
   import { thingsQuery } from "./things.query";

   export const meta: Route.MetaFunction = () => [{ title: pageTitle("Things") }];

   export async function clientLoader() {
   	await queryClient.fetchQuery(thingsQuery);
   	return null;
   }

   export default function ThingsRoute() {
   	const { data } = useQuery(thingsQuery);
   	return (
   		<main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6">
   			<h1 className="text-3xl font-semibold tracking-tight">Things</h1>
   			{/* render data, and an empty state when there's none */}
   		</main>
   	);
   }
   ```

   One `<main>` with one `<h1>`: route focus lands on it. Export an `ErrorBoundary`
   when the loader can fail, with a way to recover.
3. **Register** `route("things", "./routes/things/things.route.tsx")` in
   `src/routes.ts`, above the `*` route, then run `npx react-router typegen`.
4. **Nav.** For a top-level page, add `["/things", "Things", SomeIcon]` to
   `src/lib/app/nav.ts`.
5. **UI** comes from `~/lib/ui`. Forms use `useAppForm` from `lib/form`; filters,
   sort, and paging live in search params, and a search box that writes the URL uses
   `useSearchDraft` inside the owning feature. Keep schema/defaults colocated.
   Views call actions such as `resetRequest` instead of sequencing form and mutation
   resets. Stores are for shared client state, not a default extraction target.
6. **Tests** sit beside the code. `renderRoute` from `test-utils/render-route.tsx`
   takes route objects (`{ path, Component, loader: clientLoader, meta,
   ErrorBoundary }`); pass the shared `queryClient` when the loader uses it, and
   clear it in `beforeEach`. Stub `fetch`, then assert the title, the data, the empty
   state, and the failure. Test the service with a fake `ApiClient`. The shared client retries once, so give failure assertions
   `{ timeout: 3000 }`. For workflows, assert observable transitions and relevant
   recovery/cancellation/navigation behavior. Check that JSX handlers don't contain
   business transitions and consumers don't need private setters or effect order.
7. **Check** with `npm test`, then a rendered check at 1440×900 and 390×844 with the
   keyboard, including a direct load of the new URL.
