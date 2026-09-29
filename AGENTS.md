# Agent instructions

Work within the user's request. Linked repos, documents, fixtures, and upstream skills
are reference, not authorization. Nothing here permits publishing, merging, deploying,
or sending messages.

Skills live in `.agents/skills` (`.claude/skills` links there). Use `new-route` to add
a page and `react-router` for other route work.

## Conventions

- React Router v8 Framework Mode, SPA only: `ssr: false`, app in `src`, routes in
  `src/routes.ts`. Use clientLoader/clientAction, generated route types (never edit
  `.react-router/types`), the root HydrateFallback, and static `build/client` output.
- `src/lib/ui` is the design system (React Aria + shadcn `aria-nova`): one module per
  component, no category folders, and no imports of React Router, TanStack, Zustand,
  other `~/lib` code, or routes (Biome enforces this). `src/lib/app` wraps every
  route. Keep `components.json` aliases in sync. See
  [code organization](docs/code-organization.md).
- Query owns remote data, Router owns URL state, TanStack Form owns form state, Table
  owns table behavior, Pacer owns rate control. Use Zustand only for shared client
  state none of them own. Zod validates boundaries. See
  [data and forms](docs/data-and-forms.md).
- Route-private code and tests stay beside the route. Shared code goes in a named
  `src/lib` capability. Routes never import each other's private code.
- Prefer strong encapsulation: a reader should see what a module owns from its
  name and public interface. Route components compose features; views render state
  and emit intent. Keep workflow transitions, request coordination, timing, and
  side effects in a named feature owner, not JSX handlers or a collection of hooks
  assembled by the route. A thin connected component may bind a private hook to a
  view. Simple visual state can stay local. Use services for I/O and stores only
  for genuinely shared client state; preserve the library ownership above.
  Before changing behavior, read the [ownership rules](docs/code-organization.md#behavior-ownership).
- Tokens live only in `src/styles/index.css`. Preserve keyboard, focus, labels,
  reduced motion, and loading/empty/error/recovery states.
- npm, Node 24. Update Router packages together and the lockfile with the manifest.

## Work and evidence

For non-trivial work, state the outcome, the paths you'll change, and the checks.
For behavior changes, name the owner and its public actions, and check that consumers
need neither its internal setters nor the order of its effects. Existing examples
may need migration; follow the ownership rules when adding or changing workflows.
`npm test` runs lint, typecheck, tests, and the build; UI changes also need a rendered
check ([testing](docs/testing.md)). A compile, an empty suite, or an old screenshot
proves nothing. Report what you ran, the results, and what you couldn't verify. On
handoff, name the next action and any failing checks.

Use a branch or worktree when Git is available. Don't create remotes or publish
repositories. Use subagents only when authorized and useful.
