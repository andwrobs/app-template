# React frontend architecture and authoring guide

## Purpose and decision

This guide defines a scalable frontend structure for a React application that may be embedded in an Angular host during an incremental migration. Developers need a predictable place to find route configuration, screen UI, data loading, and supporting implementation. The structure must accommodate complex screens without turning every route into a separate Nx project.

The chosen organizational standard is **feature-grouped route folders, standard architectural files at each route root, and route-owned implementation under `lib/`**. Dot suffixes describe file roles; folders describe ownership.

The runtime examples below use the recommended **React Router Data Mode + TanStack Query** integration. This guide documents the target convention, not a verified inventory of the repository. Confirm installed API versions and the Angular/React navigation contract before applying the runtime examples. The folder convention also works with Declarative Mode.

## 1. Project boundaries

The following illustrative workspace separates responsibilities into three libraries. Paths and package aliases are placeholders, not repository-specific identifiers:

| Project | Responsibility |
| --- | --- |
| `libs/react/host` | React mounting/unmounting, providers, Angular integration, host dependencies, and any standalone bootstrap |
| `libs/react/app` | Application route definitions, layouts, pages, query configuration, client state, and feature implementation |
| `libs/react/api-client` | HTTP transport, API methods, DTOs, and API contracts |

The host composes the React application and supplies runtime dependencies. The application imports API functionality from `api-client`; it does not import Angular bootstrap internals. `api-client` does not import the application or host code.

Route folders are ordinary folders inside the application library, not new Nx projects. The project’s `src/index.ts` exposes its supported public exports; its `src/lib/` holds implementation. Keep existing project setup files in their established locations.

## 2. Directory structure and ownership

Use the following pattern. Supporting filenames are examples, not mandatory scaffolding:

```text
libs/react/app/src/
  index.ts
  lib/
    app.tsx
    routes/
      app.routes.ts
      app.layout.tsx

      items/
        items.queries.ts
        lib/
          item-status-badge/
            item-status-badge.tsx

        item-list/
          item-list.route.ts
          item-list.page.tsx
          item-list.loader.ts
          item-list.queries.ts
          lib/
            item-list-filters/
              item-list-filters.tsx

        item-detail/
          item-detail.route.ts
          item-detail.page.tsx
          item-detail.loader.ts
          item-detail.queries.ts
          item-detail.store.ts
          lib/
            build-item-request.ts
            validate-item-parameters.ts
            item-editor/
              item-editor.tsx
              item-editor.store.ts
              item-editor.provider.tsx
              item-editor.schema.ts

        item-results/
          item-results.route.ts
          item-results.page.tsx

      settings/
        settings-index/
          settings-index.route.ts
          settings-index.page.tsx
        settings-edit/
          settings-edit.route.ts
          settings-edit.page.tsx

      admin/
        admin.route.ts
        admin.page.tsx
        require-admin.middleware.ts

      not-found/
        not-found.route.ts
        not-found.page.tsx
```

**Route root:** files fulfilling the agreed route-level roles. **Route `lib/`:** all other implementation owned by that route, including components, hooks, pure functions, and supporting modules. Use `lib/` consistently even when it contains only components. Do not add a mandatory `components/` layer inside it.

Keep `lib/` shallow initially. Give a substantial component or capability its own folder when it has several related files. A function such as `build-item-request.ts` can belong directly to route implementation without belonging to a component.

Shared implementation moves to the nearest common owner: for example, `items/lib/` for code used by multiple item routes. Query keys belong in the owning `.queries.ts` file, which may sit at the feature root when multiple routes share them. Code used across feature groups can have an explicitly owned application-level shared module.

Other routes must not import a sibling route’s `lib/` internals. They also should not reach into its route-local store or query definitions; move reusable data/state functionality to the shared feature scope. Enforce boundaries through review and appropriate lint rules; directory names alone do not enforce privacy.

Folder nesting does not automatically create URL nesting. `app.routes.ts` explicitly assembles the route tree, including paths, parents, index routes, and layouts. Add a feature-level `items.routes.ts` when it makes that composition easier to read. [1]

## 3. Naming and file responsibilities

Use kebab-case filenames, PascalCase React components, and camelCase functions/objects. Use `.tsx` only when the file contains JSX. A normal screen has a route definition and a page; grouping and redirect routes may have no page.

| File | Responsibility | Typical export |
| --- | --- | --- |
| `item-detail.route.ts` | Path and router wiring: component/lazy import, loader, middleware, boundary | `itemDetailRoute` or `createItemDetailRoute` |
| `item-detail.page.tsx` | Screen composition, query subscriptions, URL inputs, interactions | `ItemDetailPage` |
| `item-detail.loader.ts` | Interpret navigation inputs; start or await required queries | `itemDetailLoader` or `createItemDetailLoader` |
| `item-detail.queries.ts` | Related query-option factories: keys, query functions, shared cache settings | `itemDetailOptions` |
| `items.queries.ts` | Shared feature-level query keys and any query definitions used across item routes | `itemsKeys` |
| `item-detail.mutations.ts` | Related mutation hooks/options and invalidation behavior | `useUpdateItem` |
| `item-detail.store.ts` | Page-wide client state and state-changing actions | `createItemDetailStore` |
| `item-detail.schema.ts` | Route/page-level runtime validation schemas | `itemDetailSearchSchema` |
| `item-detail.types.ts` | Route/page-level types that cannot sensibly remain with their definitions | `ItemDetailFilters` |
| `items.layout.tsx` | Shared UI surrounding child routes, usually with an `Outlet` | `ItemsLayout` |
| `require-admin.middleware.ts` | Reusable navigation prerequisites | `requireAdminMiddleware` |
| `items.error-boundary.tsx` | Error UI for the route scope where it is attached | `ItemsErrorBoundary` |
| `item-detail.module.css` | Page styles when using CSS Modules | — |

Tests sit beside their subject and preserve its basename, for example `item-detail.loader.test.ts` and `item-editor.test.tsx`. Hooks and pure helpers use descriptive names such as `use-item-selection.ts` and `build-item-request.ts`; they normally live under the owning `lib/`.

**When a responsibility exists, it has a standard home.** Under this standard, an implemented loader gets a `.loader.ts` file even when short. Do not create placeholder stores, schemas, middleware, or boundaries. Shared layouts and boundaries belong at their actual scope, not in every route folder. A component-owned store stays with that component; its suffix does not promote it to route-root scope.

Dot suffixes are a team convention, not automatic React Router behavior. They make roles searchable and predictable without requiring a wrapper component around every page.

## 4. Query definitions, keys, and loaders

Use `.queries.ts` for a collection of related query definitions, even if it initially contains one. This avoids renaming the file as it grows. A singular `.query.ts` convention would also be valid, but this guide uses the plural consistently.

A query file contains named `queryOptions` factories, their API calls, and shared settings such as `staleTime`. It does not parse router requests, render UI, or hold editable client state. HTTP details and DTOs remain in `api-client`. TanStack recommends `queryOptions` to share query identity and fetching configuration with type inference. [3]

Group keys by data domain and define them alongside query options in `.queries.ts` files. When several routes need the same keys, put them in a shared feature-level `.queries.ts` file rather than creating a separate `.keys.ts` module or an application-wide registry. Queries, mutations, and cache updates can import the same keys to invalidate at an intentional scope.

```ts
// items/items.queries.ts
export const itemsKeys = {
  all: ["items"] as const,
  details: () => [...itemsKeys.all, "detail"] as const,
  detail: (id: string) => [...itemsKeys.details(), id] as const,
};
```

`all` targets item-related queries; `details()` targets the detail family; `detail(id)` targets that record and any more-specific keys beneath it. Use `exact: true` when an operation must match only the full key. Include every changing input that affects the response, including relevant filters and identity/tenant scope. Clear or segregate cached data when the authenticated scope changes.

Below, the `@app/api-client` alias and `getItem` signature are illustrative; adapt them to the actual workspace API. Keep these responsibilities and dependency directions intact:

```ts
// item-detail/item-detail.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { itemsApi } from "@app/api-client";
import { itemsKeys } from "../items.queries";

export function itemDetailOptions(id: string) {
  return queryOptions({
    queryKey: itemsKeys.detail(id),
    queryFn: ({ signal }) => itemsApi.getItem(id, { signal }),
    staleTime: 30_000,
  });
}
```

Keep the loader separate: it decides **when and for which navigation inputs** to fetch. The query definition describes **what to fetch and how to cache it**. This lets the page, loader, and hover prefetch reuse the same definition.

```ts
// item-detail/item-detail.loader.ts
import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { itemDetailOptions } from "./item-detail.queries";

export const createItemDetailLoader = (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    if (!params.itemId) {
      throw new Response("Missing item ID", { status: 400 });
    }

    // Critical-data example: wait; failures reach the route boundary.
    await queryClient.query(itemDetailOptions(params.itemId));
    return null;
  };
```

```ts
// item-detail/item-detail.route.ts
import type { QueryClient } from "@tanstack/react-query";
import type { RouteObject } from "react-router";
import { createItemDetailLoader } from "./item-detail.loader";

export function createItemDetailRoute(queryClient: QueryClient) {
  return {
    path: "items/:itemId",
    loader: createItemDetailLoader(queryClient),
    lazy: async () => ({
      Component: (await import("./item-detail.page")).ItemDetailPage,
    }),
  } satisfies RouteObject;
}
```

```tsx
// item-detail/item-detail.page.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { itemDetailOptions } from "./item-detail.queries";

export function ItemDetailPage() {
  const { itemId } = useParams();
  if (!itemId) throw new Error("ItemDetailPage requires itemId");
  return <ItemDetailContent itemId={itemId} />;
}

function ItemDetailContent({ itemId }: { itemId: string }) {
  const query = useQuery(itemDetailOptions(itemId));
  if (query.isPending) return <p>Loading item…</p>;
  if (query.isError) return <p role="alert">Unable to load item.</p>;
  return <pre>{JSON.stringify(query.data, null, 2)}</pre>;
}
```

The last render is deliberately a minimal example; replace it with the screen’s components. The host supplies one stable `QueryClient` to both the route factories and `QueryClientProvider`. Do not create a different client inside a loader or page render. The route factory keeps dependencies explicit without making the application import the host. A static loader alongside a lazy page can fetch while the page module downloads. [2]

**API compatibility:** these snippets use `queryClient.query`, as shown in the current TanStack docs reviewed for this guide. Verify the installed package before copying. Versions with the older API use `fetchQuery(options)` for the awaited, throwing path and `prefetchQuery(options)` for a prefetch that suppresses errors. Do not combine APIs from different installed versions. [3][4]

### Choose the loading behavior deliberately

| Behavior | Loader | User experience |
| --- | --- | --- |
| Wait for critical data | Await the throwing query call | Router remains pending; failure can reach the route boundary |
| Start without waiting | `void queryClient.query(options).catch(() => {}); return null;` | Page mounts and uses its own query loading/error UI |

The non-blocking catch is intentional only for speculative prefetching: the page still subscribes to the query and handles its state. It is not a general error-handling policy.

With the same client and key, `useQuery` shares an in-flight fetch or reads its completed cache entry. Fresh completed data avoids a normal mount refetch; stale data can display immediately and refetch in the background. The default `staleTime` is zero, so choose freshness deliberately and share the same settings between loader and page. Thirty seconds above is illustrative, not a global requirement. [4][5]

Mutation code uses the same keys to update or invalidate the cache. Do not copy server responses into a Zustand store merely to make them available to components. Editable drafts can legitimately live separately from the server cache.

## 5. Middleware, state, and supporting functions

React Router 8 Data Mode supports a `middleware` array on route objects. Use it for prerequisites shared across routes, such as waiting for host authentication or checking navigation permissions. Parent middleware covers matched descendants. Server APIs must still enforce access. [6]

```ts
// Example middleware body; requireSession is a supplied application dependency.
async function authMiddleware() {
  await requireSession();
}
```

There is no need to call `next()` for setup-only middleware; successful completion continues the chain automatically. Use `await next()` when work must also run after the remaining middleware and loaders/actions, for example timing. It does not wait for page rendering or a query that the loader started without awaiting. Middleware is not an interceptor for later Query background requests. No post-fetch middleware work is required by this architecture. [6]

Keep state with its owner:

| State owner | Location |
| --- | --- |
| Page and several of its components | Route-root `item-detail.store.ts` |
| Item editor and its descendants | `lib/item-editor/item-editor.store.ts` |
| Several item routes | A deliberately shared feature-level store |

File location does not control lifetime. A module-level Zustand store is shared by its importers. For independent editor instances, create a store per instance and provide it through React context; keep it stable across renders. Decide whether page state should reset on unmount or persist across navigation. Use local React state when a store is unnecessary. [7]

Pure helpers belong in descriptive implementation files: request construction in `build-item-request.ts`, for example. Stores may call these functions, but functions do not belong in a store simply because they are not components. Avoid catch-all `utils.ts` modules. Introduce a capability folder such as `lib/request-building/` when several related helpers grow together.

## 6. Host integration and choices considered

Data Mode is the recommended baseline when React owns navigation among migrated React features: loaders start queries before rendering, middleware coordinates prerequisites, and router pending states can represent awaited work. Router actions are optional; Query mutations can own updates and invalidation. Declarative Mode remains reasonable when the host controls navigation tightly and component-level loading is sufficient. Data Mode alone does not provide automatic hover prefetch; manually invoke Query prefetching on hover/focus when useful. React Router’s `Link prefetch` feature belongs to Framework Mode. [8]

An embedded Angular/React boundary requires an explicit implementation contract:

- Who owns browser-history updates inside the React-owned URL subtree?
- How do direct links, back/forward, and navigation out of the React-owned subtree reach the correct router?
- Does the host keep the React application mounted across internal navigation? Who disposes the router on unmount?
- What is the lifetime of the QueryClient and any shared state, including on logout?

Do not assume a browser-router `basename` synchronizes Angular and React. A delegated browser subtree or a host-synchronized memory router can implement the boundary; the repository’s existing integration must determine the choice. No new React server is required for these client-side Data Mode examples.

| Organization considered | Tradeoff and decision |
| --- | --- |
| All route files flat | Simple to browse, but supporting helpers obscure the standard route files |
| Route-level `components/` only | Clear for UI, but does not provide a home for all non-UI implementation |
| Route-level `lib/` | Chosen: preserves a predictable root and accommodates components and functions uniformly |
| Loader and queries in one file | Fewer files, but mixes navigation decisions with reusable query definitions; keep separate |
| Separate Nx project per route | Adds project-management overhead; use folders within the application library |

`lib` means “library.” It is established software vocabulary for library/supporting implementation, not an automatic privacy mechanism. In Nx, `src/lib` holds library source; `src/index.ts` is the public export surface. At route scope, this guide uses the name for route-owned supporting implementation. Source/binary describes code’s form; executable/library describes its role—a library can contain source code. [9]

## 7. Applying the standard

1. Preserve the host/application/API-client project boundaries. Identify the existing exported entry points and navigation bridge before moving runtime wiring.
2. Rename screen implementations currently called `*.route.tsx` to `*.page.tsx`. Add the corresponding `*.route.ts` definitions and update imports.
3. Create route folders under example feature groups such as `items/`, `settings/`, and `admin/`. Move supporting implementation into each route’s `lib/`; retain tests beside their subjects.
4. Separate implemented loaders and shared query options. Keep keys in the appropriate `.queries.ts` file, at feature scope when shared. Inject the same stable QueryClient into loaders and the provider.
5. Assemble the route tree centrally. Add shared middleware, layouts, and boundaries only where required.
6. Check one representative route: fresh/in-flight cache reuse, stale-data behavior, query errors, mutation invalidation, and independent editor state. Exercise direct entry, back/forward, navigation across the Angular boundary, and unmount/remount.
7. Document the permitted import boundaries and apply the repository’s lint/review mechanisms. New routes follow the convention; they do not generate empty files for unused roles.

## References

Framework documentation referenced as of 22 October 2026. File organization and suffix requirements are conventions defined by this guide; the references support underlying framework behavior.

1. [React Router: Data Mode routing](https://reactrouter.com/start/data/routing)
2. [React Router: lazy routes and parallel static loaders](https://reactrouter.com/6.30.3/route/lazy)
3. [TanStack Query: query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
4. [TanStack Query: prefetching and router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
5. [TanStack Query: important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) and [request deduplication](https://github.com/TanStack/query/discussions/608)
6. [React Router: middleware](https://reactrouter.com/how-to/middleware)
7. [Zustand: creating scoped stores with context](https://zustand.docs.pmnd.rs/learn/guides/initialize-state-with-props)
8. [React Router: choosing a mode and API availability](https://reactrouter.com/start/modes)
9. [Nx: library public API](https://nx.dev/blog/react-vite-and-typescript-get-started-in-under-2-minutes)
