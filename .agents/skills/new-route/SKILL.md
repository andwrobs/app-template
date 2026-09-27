---
name: new-route
description: Add a page or feature route to this app in its house style (route folder, title, Query-backed clientLoader, view-plus-hook components, tests beside the code, routes.ts, and nav). Use whenever you add a screen; use react-router for other route work.
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
  <thing>.query.ts           # queryOptions and the Zod schema, if it loads data
  components/<Name>/         # only for parts worth splitting out
    <Name>.tsx               # view: renders from props
    use<Name>.ts             # hook: Query, URL state, stores
    <Name>.test.tsx
    index.ts
```

Import other features only through `src/lib`, never from another route's folder.

## Steps

1. **Data.** In `<thing>.query.ts`, export `queryOptions` whose `queryFn` calls
   `api(path, schema, { signal })` from `lib/api` (or `fetchJson` for a full URL).
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
   `useSearchDraft`.
6. **Tests** sit beside the code. `renderRoute` from `test-utils/render-route.tsx`
   takes route objects (`{ path, Component, loader: clientLoader, meta,
   ErrorBoundary }`); pass the shared `queryClient` when the loader uses it, and
   clear it in `beforeEach`. Stub `fetch`, then assert the title, the data, the empty
   state, and the failure. The shared client retries once, so give failure assertions
   `{ timeout: 3000 }`.
7. **Check** with `npm test`, then a rendered check at 1440×900 and 390×844 with the
   keyboard, including a direct load of the new URL.
