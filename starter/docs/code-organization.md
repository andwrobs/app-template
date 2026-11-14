# Code organization

A route owns the components, behavior, tests, and helpers that change with it. Code
moves to `src/lib` only when routes share it or it wraps all of them, and each
directory there is a named capability.

```text
src/
  root.tsx                  # Document, fallback, error boundary; renders lib/app
  routes.ts
  services.ts               # Composition root: a getter per service
  lib/
    ui/                     # Design system, one module per component
      button.tsx            # A file...
      date-picker/          # ...or a folder once it has siblings
        date-picker.tsx     # Imported as ~/lib/ui/date-picker/date-picker
        date-picker.test.tsx
      utils.ts              # cn
    app/                    # Providers, layouts, header, route focus, skip link
    query/client.ts         # QueryClient shared by loaders and React
    api/                    # fetchJson, ApiClient, and ApiError
    env/                    # VITE_ settings: schema (checked by vite.config.ts), env
    form/                   # TanStack Form bound to lib/ui fields
    meta/                   # App name and page titles
    theme/                  # Light and dark theme (Zustand) and its head script
    url-state/              # URL-backed input drafts
    once/                   # Build on first call, for service getters
    results/                # A domain: schema and service
      results.ts            # Schema and types
      results.service.ts    # ResultsService and createResultsService
      results.service.test.ts
  routes/
    projects/
      projects.route.ts     # meta, clientLoader, export default ProjectsPage
      projects.page.tsx     # The screen
      projects.route.test.tsx
      results.queries.ts    # Query options calling getResultsService()
      lib/                  # Everything else the route owns
        filter-bar/
          filter-bar.tsx    # Thin connected entry point
          filter-bar-view.tsx # Renders props and emits intent
          use-filter-bar.ts # Private behavior owner
          filter-bar.test.tsx
```

A route folder is its role files plus one `lib/`. `.route.ts`, `.page.tsx`,
`.layout.tsx`, `.provider.tsx`, `.queries.ts`, `.mutations.ts`, `.store.ts`,
`.search.ts` and their tests sit at the route root. Everything else the route owns
(components, hooks, schemas, slices, pure functions) goes in `lib/`, flat
until a component or capability has several files, then in a kebab-case folder:
`lib/filter-bar/`. File names are kebab-case, exports are named, types use `type`,
and there are no `index.ts` barrels; import from the file. Services live in a
`src/lib` domain folder, beside the domain's schema.

## Placement

| Code | Goes in |
| --- | --- |
| Used by one component | That component's folder in the route's `lib/` |
| A route role (`.route.ts`, `.page.tsx`, `.queries.ts`, ...) | The route root |
| Anything else one route owns | The route's `lib/` |
| Used across routes | A named capability in `src/lib` |
| Visual primitive or pattern with no app knowledge | `lib/ui` |
| Wraps every route (providers, layout, navigation) | `lib/app` |
| Binds Form, Table, Query, or the router to UI, shared across routes | A capability such as `lib/form`, never `lib/ui` |
| A service | The factory in a `src/lib` domain folder; its getter in `src/services.ts` ([services and state](services-and-state.md)) |

Tests sit next to the code they test. Folders in `lib/` are named by concept, never
by type: no `components`, `queries`, `stores`, `types`, `utils`, or `hooks` folders.

## Behavior ownership

Prefer strong encapsulation over spreading a workflow across files. A module's name
and public interface should tell a reader what it owns. Keep related state,
transitions, and effects together behind a small interface; extraction is useful
when it creates that boundary, not merely when it shortens a file.

- **Route modules** (`.route.ts`) own framework exports (`meta`, loaders, actions,
  boundaries). **Pages** (`.page.tsx`) compose the screen; they don't implement
  feature workflows or assemble a collection of private component hooks. Loaders and actions delegate
  domain work to the owning module.
- **Views** render state and emit intent. Formatting and conditional rendering
  belong here. Handlers, including ones that read an event, submission sequences,
  cache invalidation, selection merging, URL synchronization, retries, and timer
  policies belong to the behavior owner; views bind its handlers by reference
  ([components and handlers](services-and-state.md#components-and-handlers)).
- **Connected components** bind one cohesive behavior interface to a view. Keep
  this adapter thin; moving the route's entire workflow into another `.tsx` file
  doesn't separate rendering from behavior.
- **Feature hooks** own React subscriptions, lifecycle, and integration between the
  existing libraries. Keep pure decisions in nearby functions or a reducer when
  transitions become complex. A state-machine library is optional, not a default.
- **Services** perform I/O and domain decisions under the
  [service rules](services-and-state.md#services). Group operations by domain; a
  service isn't a bucket for unrelated logic.
- **Stores** own genuinely shared client state under the
  [store rules](services-and-state.md#stores). Don't move local workflows into a
  global store just to empty a component. Preserve Query, Router, Form, Table, and
  Pacer ownership described in [data and forms](data-and-forms.md).

Local visual state (an open popover, a selected demo tab) can stay with its component.
Existing library bindings such as `lib/form` and app infrastructure such as route
focus may subscribe and manage lifecycle for their explicit purpose. Static pages
need no controller. Purity here separates rendering from application workflows;
it doesn't forbid every hook or require a wrapper around every primitive.

A self-contained feature exposes its connected entry point. Its hook and view stay
private unless another consumer has a concrete need for them:

```tsx
// lib/filter-bar/filter-bar-view.tsx
export function FilterBarView(props: FilterBarProps) { /* render from props */ }

// lib/filter-bar/use-filter-bar.ts: integrates queries, stores, and route state
export function useFilterBar(): FilterBarProps { /* ... */ }

// lib/filter-bar/filter-bar.tsx: the only place that wires this feature
export function FilterBar() {
  const props = useFilterBar();
  return <FilterBarView {...props} />;
}

// projects.page.tsx: composition
return <FilterBar />;
```

If several parts coordinate one workflow, give them a common feature owner instead
of independent controllers that synchronize each other. Use the smallest structure
that makes that ownership clear. Keep schemas, types, defaults, and pure helpers
beside their domain; they don't each need a layer or directory.

Expose meaningful actions such as `resetRequest`, `changeSearch`, or `discardPending`.
Consumers shouldn't sequence `form.reset()` and `mutation.reset()`, merge library
selection formats, or manipulate internal flags. Typed Form/Table bindings can pass
through a private adapter where necessary; don't duplicate their APIs or state.
Use discriminated unions for mutually exclusive workflow states when they remove
invalid combinations. Independent facts such as saving and having a queued edit may
coexist, so don't force them into an artificial single status.

When reviewing a behavior change, identify its owner, public actions, state source,
and lifecycle policy, then run the [layer review](services-and-state.md#review). Follow an action from the view to its effect: a consumer that
must know the internal sequence signals a leaking boundary. Test observable
transitions, failures, cancellation, and navigation where relevant; hook counts,
file lengths, and naming checks don't prove encapsulation.

## Design system and app

`lib/ui` holds shadcn Aria primitives, patterns built from them, and `cn`. Subfolders
are components, never categories. It can import React, React Aria, styling utilities,
icons, and whatever its registry components need. It never imports React Router,
TanStack, Zustand, other `~/lib` code, or routes (Biome enforces this).

`root.tsx` wraps routes in `AppLayout` (a header). For a dashboard-style app, render
`SidebarLayout` instead; both read the links in `lib/app/nav.ts`.

Aria `Link` and `LinkButton` navigate client-side through the `RouterProvider` in
`lib/app/app-providers.tsx`, the only place the design system meets the router. Routes
don't import `lib/app`. Extract anything a route needs from it into its own capability.

Presentational parts such as `field.tsx` and `table.tsx` go in `lib/ui`. Bindings such
as a TanStack Form `createFormHook` or a TanStack Table data table stay in the route,
or move to a capability like `lib/form` once routes share them.

```text
routes/*  ──►  lib/<capability>  ──►  lib/ui
root.tsx  ──►  lib/app           ──►  lib/query, lib/ui
```

`src/lib` never imports `src/routes`, and no file outside a route imports its `lib/`
or role files (Biome enforces both). `src/routes.ts` names route modules by path.

Because `lib/ui` has no app imports, it can become a workspace package later without a
rewrite. Do that when it has its own API or owner, or a second app uses it.

## shadcn

The `components.json` aliases all point into `~/lib/ui`, so the CLI writes registry
files there and rewrites upstream `@/...` imports to match. Change the aliases and
this doc together.

- Refresh components by generating them in a scratch copy and diffing against
  `lib/ui`. Keep local changes, and never overwrite in bulk.
- Registry files keep upstream kebab-case names. A component can become a folder,
  imported by file (`~/lib/ui/date-picker/date-picker`). The CLI doesn't know about
  folders: adding a component that depends on `button/` writes a new `button.tsx`
  that shadows it. Delete that file and fix its imports.
- Blocks (`registry:block`) land in `lib/ui` too. Move route links, data loading, and
  app state into `lib/app` or the owning route. Lint flags them.

## Examples

Examples live in `src/routes/examples/<name>/`, their services and schemas in
`src/lib/demo`, and fixtures in `public/demo`. To remove them, delete the three
folders, the `exampleRoutes` lines in `src/routes.ts`, the example lines in
`src/services.ts`, and the `/examples/` links in `lib/app/nav.ts` and
`routes/home/home.page.tsx`.
