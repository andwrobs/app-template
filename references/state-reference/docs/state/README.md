# State

How a React single-page app built on React Router, TanStack Query, TanStack Form
and Zustand decides where each piece of state lives, and the few shapes that state
takes. Follow it from the first screen: the patterns cost little when a screen is
small and stop it from needing a rewrite when it grows.

Assumes React 19, React Router in framework mode with `ssr: false`, TanStack Query 5,
TanStack Form, Zustand 5 and TypeScript in strict mode. The example throughout is a
project page at `projects/:projectId` that lists tasks, with a selection, a details
panel and an Archive command.

| Page | Covers |
| --- | --- |
| This page | Who owns what, how to place new state, the rules in one list |
| [Route stores](route-stores.md) | A screen's shared state: the store, slices, ports, and the kit that builds them |
| [Commands](commands.md) | Writes: mutations, command slices, and work that outlives the screen |
| [App state and persistence](app-state-and-persistence.md) | App-lifetime stores, settings, device memory, the storage adapter |
| [Environment and focus](environment-and-focus.md) | Media queries and shared focus targets |
| [Enforcement and review](enforcement-and-review.md) | Lint rules, the review checklist, and the alternatives these rules replace |

## Who owns what

Every piece of state has exactly one owner. Nothing is copied from one owner into
another.

| State | Owner | Lives |
| --- | --- | --- |
| Data the server holds | TanStack Query | The cache |
| What Back, reload and a shared link should restore (the record, sort, filter, an open preview) | React Router: path and search params | The URL |
| A form's draft, touched fields and errors | TanStack Form | The form |
| A write one feature hook starts and shows | A Query mutation in that hook | The hook |
| Screen state two capabilities share (a selection, an open panel, a command in progress) | A route store | One subject on screen |
| Work and coordination that outlive every screen (uploads, a drag across panes, a command palette) | An app-lifetime store in its `src/lib` capability | The tab |
| Settings: choices the viewer expects everywhere (a view, a density, a panel left open) | `src/lib/preferences` | This browser, or the server once settings sync |
| Device memory: what this browser remembers (expanded tree nodes, recent items) | A persisted store in the `src/lib` capability that uses it | This browser |
| Environment: breakpoints, pointer type | One adapter module, read through a hook or a port | The browser |
| Where focus goes next, when capabilities share the targets | A focus scope | One subject on screen |
| Anything one component reads (an open popover, a hover) | The component | The component |

A **capability** is one thing a screen does, in its own folder beside the route
module: `selection/`, `details/`, `archive/`. A **subject** is what a screen
describes: the project a project page shows. A screen with no subject (a settings
page) describes the route itself.

## Where does this state go?

Ask in order. The first yes is the answer.

1. Does the server hold it, or is it derived from what the server holds? **Query.**
   Derive in a selector or a pure function; don't store the result.
2. Should Back, reload or a pasted link restore it? **The URL.**
3. Is it a field of a form? **TanStack Form.**
4. Is it the progress of a write that one hook starts and one hook shows?
   **A mutation in that hook.**
5. Does only one component read it? **The component.**
6. Would the viewer expect it on another device? **A setting.**
7. Should this browser remember it across reloads, and nothing more?
   **Device memory.**
8. Must it survive leaving the screen while the tab stays open?
   **An app-lifetime store.**
9. Do two capabilities of one screen read it, or must an action in another
   capability change it? **A slice of the route store.**
10. None of these: it stays in the feature hook that uses it.

If the answer needs a lifetime, a persistence mechanism or a cross-store pattern
these pages don't have, that is a design decision. Make it deliberately and write
it down before the code, because the second way of doing something is what erodes
a codebase.

## The rules

1. **One owner.** State lives with the owner the table names and is never mirrored
   into another. A store that copies server data, a URL param or a setting will
   show a stale copy.
2. **A store's identity is the identity of what it describes.** A route store is
   created for one subject and keyed by it (`key={projectId}`). Another subject is
   another store. State carries no subject id, and no store has a reset action.
3. **Global means outlives every screen.** Only then is a store built with
   Zustand's `create`, and it lives in `src/lib`, never under `src/routes`.
4. **One slice, one key.** Each capability owns one key of state and one key of
   actions in its screen's store. Slices never import each other.
5. **A store receives ports.** Everything from outside arrives as a function named
   for the need. No Query client, service, store or browser adapter enters a route
   store.
6. **Rules are pure functions.** A transition takes state and an intent and returns
   the next state. Slices apply transitions; they don't decide.
7. **Request state lives where its observers are.** One hook: a mutation. Several
   capabilities of a screen: a command slice. Beyond the screen: an app-lifetime
   owner.
8. **Read through unless the store must react.** An action reads a current outside
   value through a port at that moment. A store mirrors an outside value only when
   a change in it is itself a transition.
9. **One persistence path.** `persist` with `partialize` over one storage adapter.
   No other module touches `localStorage` or `sessionStorage`.
10. **No DOM in stores.** Shared focus targets live in a focus scope. A store holds
    at most a serializable focus intent.
11. **One shape.** State keys, then `actions` (a stable object), then `start` when
    something subscribes. Wrapped in `devtools`, enabled only in development.

## Files

```text
src/
  lib/
    route-store/route-store.tsx     # the kit: context, provider, hooks, slice scopes
    focus/focus-scope.tsx           # shared focus targets
    ui/media-query.ts               # the one module that calls matchMedia
    ui/use-media-query.ts
    preferences/
      viewer-storage.ts             # the one module that touches localStorage
      settings.store.ts             # private to this folder
      settings.ts                   # hooks and ports: what everything else imports
    <capability>/<name>.store.ts    # an app-lifetime store, with its capability
  routes/
    project/
      project.route.tsx             # loader, composition, builds the store's ports
      project.store.ts              # types, createProjectStore(deps), context, focus scope
      project.store.test.ts
      selection/selection.slice.ts
      details/
        details-state.ts            # pure transitions
        details.slice.ts
        useDetails.ts               # feature hook
      archive/
        archive-flow.ts             # pure transitions for a command
        archive.slice.ts
```

Suffixes carry meaning: `.store.ts` is a store, `.slice.ts` is one capability's
part of a route store, and lint rules key on both. A route with no shared state
has no store.
