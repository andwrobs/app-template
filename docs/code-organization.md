# Code organization

A route owns the components, behavior, tests, and helpers that change with it. Code
moves to `src/lib` only when routes share it or it wraps all of them, and each
directory there is a named capability.

```text
src/
  root.tsx                  # Document, fallback, error boundary; renders lib/app
  routes.ts
  lib/
    ui/                     # Design system, one module per component
      button.tsx            # A file...
      date-picker/          # ...or a folder once it has siblings
        date-picker.tsx
        date-picker.test.tsx
        index.ts            # Keeps the import path ~/lib/ui/date-picker
      utils.ts              # cn
    app/                    # Providers, layouts, header, route focus, skip link
    query/client.ts         # QueryClient shared by loaders and React
    form/                   # TanStack Form bound to lib/ui fields
    meta/                   # App name and page titles
    theme/                  # Light and dark theme (Zustand) and its head script
    url-state/              # URL-backed input drafts
  routes/
    projects/
      components/           # Route-private component modules
        FilterBar/
          FilterBar.tsx     # Stateless view
          useFilterBar.ts   # Its behavior
          FilterBar.test.tsx
          index.ts
      lib/                  # Non-view code shared within the route
        results.query.ts
        results.query.test.ts
      projects.route.tsx    # Registered in src/routes.ts
      projects.route.test.tsx
```

## Placement

| Code | Goes in |
| --- | --- |
| Used by one component | That component's folder |
| Coordinates a route, or used by several of its components | The route root or its `lib/` |
| Used across routes | A named capability in `src/lib` |
| Visual primitive or pattern with no app knowledge | `lib/ui` |
| Wraps every route (providers, layout, navigation) | `lib/app` |
| Binds Form, Table, Query, or the router to UI, shared across routes | A capability such as `lib/form`, never `lib/ui` |

Tests sit next to the code they test. Keep a route's `lib/` flat until some files form
a subsystem, then group them by concept (`lib/results/query.ts`), not by type. No
`queries`, `stores`, `types`, `utils`, `hooks`, or `components` folders inside any
`lib`. A route's `components/` folder is the only components folder.

A component folder holds the view, its private hook and helpers, and tests. The view
renders only from props, and the hook does the integration:

```tsx
// FilterBar.tsx
export function FilterBar(props: FilterBarProps) { /* render from props */ }

// useFilterBar.ts: integrates queries, stores, and route state
export function useFilterBar(): FilterBarProps { /* ... */ }

// projects.route.tsx
const filterBarProps = useFilterBar();
return <FilterBar {...filterBarProps} />;
```

## Design system and app

`lib/ui` holds shadcn Aria primitives, patterns built from them, and `cn`. Subfolders
are components, never categories. It can import React, React Aria, styling utilities,
icons, and whatever its registry components need. It never imports React Router,
TanStack, Zustand, other `~/lib` code, or routes (Biome enforces this).

Aria `Link` and `LinkButton` navigate client-side through the `RouterProvider` in
`lib/app/AppProviders.tsx`, the only place the design system meets the router. Routes
don't import `lib/app`. Extract anything a route needs from it into its own capability.

Presentational parts such as `field.tsx` and `table.tsx` go in `lib/ui`. Bindings such
as a TanStack Form `createFormHook` or a TanStack Table data table stay in the route,
or move to a capability like `lib/form` once routes share them.

```text
routes/*  ──►  lib/<capability>  ──►  lib/ui
root.tsx  ──►  lib/app           ──►  lib/query, lib/ui
```

`src/lib` never imports `src/routes` (Biome enforces this), and routes never import
each other's private code.

Because `lib/ui` has no app imports, it can become a workspace package later without a
rewrite. Do that when it has its own API or owner, or a second app uses it.

## shadcn

The `components.json` aliases all point into `~/lib/ui`, so the CLI writes registry
files there and rewrites upstream `@/...` imports to match. Change the aliases and
this doc together.

- Refresh components by generating them in a scratch copy and diffing against
  `lib/ui`. Keep local changes, and never overwrite in bulk.
- Registry files keep upstream lowercase names. A component can become a folder with
  an `index.ts` re-export. The CLI doesn't know about folders: adding a component that
  depends on `button/` writes a new `button.tsx` that shadows it. Delete that file.
- A per-component `index.ts` is fine. A catalog-wide `lib/ui/index.ts` barrel isn't.
- Blocks (`registry:block`) land in `lib/ui` too. Move route links, data loading, and
  app state into `lib/app` or the owning route. Lint flags them.

## Examples

Examples live in `src/routes/examples/<name>/`, with fixtures in `public/demo`, and
shared code never imports them. To remove them, delete both folders, the
`exampleRoutes` lines in `src/routes.ts`, and the `/examples/` links in
`lib/app/AppHeader.tsx` and `routes/home/home.route.tsx`.
