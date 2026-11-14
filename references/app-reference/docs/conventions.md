# Conventions

The choices a capable engineer or agent can't infer, because any of several
answers would be reasonable. Each is here so every file in the codebase makes the
same one. Rules about competence (write clear names, handle errors) are left out
on purpose.

Part of the [app reference](README.md).

## Files

- **kebab-case file names, always.** `details-toggle.tsx`, `use-details.ts`. Case
  never differs between a file and its import, on any file system.
- **The role is a suffix.** `.route.ts`, `.page.tsx`, `.layout.tsx`,
  `.provider.tsx`, `.queries.ts`, `.mutations.ts`, `.service.ts`, `.store.ts`,
  `.slice.ts`, `.search.ts`, `.test.ts`. A role that exists gets its suffix; don't
  invent a new suffix without adding it to the relevant guide:
  [Data Mode routing](routing.md) or [Framework Mode routing](framework-routing.md).
- **A route folder is its role files plus one `lib/`.** `.route.ts`, `.page.tsx`,
  `.layout.tsx`, `.provider.tsx`, `.queries.ts`, `.mutations.ts`, `.store.ts`,
  `.search.ts` and their tests sit at the route root. Everything else the route
  owns (components, hooks, services, schemas, slices, pure functions) goes in
  `lib/`, flat until a component or capability has several files, then in a
  kebab-case folder: `lib/details/`. No `components/` folder.
- **Named exports by default.** Framework Mode requires default exports for its
  route components and configuration files; those are deliberate exceptions.
  For a separate page, explicitly import the named component in the route module,
  then `export default ProjectPage`. No barrel `index.ts` files; import from the file.
- **One main thing per file**, named after the file. Small private helpers may sit
  beside it.
- **About 200 lines is the signal to look for a second responsibility.** It is not
  a limit. Split when a file has two reasons to change, never to hit a number, and
  never into `utils.ts` or `helpers.ts`.
- **Tests sit beside the code** as `<file>.test.ts`.

In Data Mode, `.route.ts` owns `defineRoute`. In Framework Mode, `.route.ts`
exports the framework's runtime API and `routes.ts` alone registers routes. In
both, the screen is always a separate `.page.tsx`. See [routing](routing.md) and
[Framework Mode routing](framework-routing.md).

## Functions and components

- **`function` declarations for components, hooks and top-level functions.** Arrow
  functions for callbacks and inline arguments.
- **One props type per component**, declared just above it, named `<Component>Props`
  when it is exported or reused, inline when it is a field or two. A Framework
  route component uses the registered route module's generated
  `Route.ComponentProps`, including when the component lives in `.page.tsx`.
- **Views take data and callbacks; hooks return intent and status.** A callback is
  named for the intent (`archive`, `rename`), not the event (`onClick`).
- **Early returns over nested conditions.** No nested ternaries.
- **Effects only synchronise with something outside React.** Derive during render;
  respond to events in handlers.
- **No `useMemo`/`useCallback` by default.** Add one for a measured cost or a
  required stable identity, with a comment saying which.

## Types

- **`type`, not `interface`**, unless declaration merging is needed.
- **No `any`, no non-null `!`, no `enum`.** Use `unknown` and narrow; use string
  unions.
- **`as` only at a parsed boundary**, next to the check that justifies it.
- **Parse what crosses a boundary** (network, storage, URL) with a schema, and
  infer the type from the schema.
- **Exported functions declare their return type** when it isn't a one-line
  expression.

## Comments

- **Comments say why**, or state a constraint the code can't show. Never what the
  next line does.
- **Every exported symbol has a one- or two-line doc comment** saying what it is
  for, not how it works.
- **No commented-out code, no change history, no "new"/"old"/"fixed" notes.** Git
  holds those.
- **A `TODO` names what blocks it** and where the work is tracked, or it isn't
  written.

## Formatting and lint

The formatter decides formatting; nobody argues with it or disables it. Lint
enforces what it can, so these rules don't depend on being remembered:
`noDefaultExport` (with overrides for Framework route and configuration files),
`useFilenamingConvention` (kebab-case), `noExplicitAny`,
`noNonNullAssertion`, `noEnum`, plus the import restrictions in
[enforcement](state/enforcement-and-review.md). A rule is disabled per line, with
the reason beside it.
