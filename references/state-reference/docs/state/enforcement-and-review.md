# Enforcement and review

Rules that live only in prose drift. Enforce what a tool can see, and ask the rest
in review.

## What lint enforces

With Biome, each rule is an override on a path. Give every message the fix, not
only the prohibition.

**Browser globals have one owner each.**

```jsonc
{
	"includes": ["src/**", "!src/lib/preferences/**", "!src/lib/ui/media-query.ts"],
	"linter": { "rules": { "style": { "noRestrictedGlobals": {
		"level": "error",
		"options": { "deniedGlobals": {
			"localStorage": "Browser storage belongs to src/lib/preferences. Keep the value in a store persisted with persist/partialize over viewerStorage.",
			"sessionStorage": "Browser storage belongs to src/lib/preferences. Keep the value in a store persisted with persist/partialize over viewerStorage.",
			"matchMedia": "Media queries go through ~/lib/ui/media-query: useMediaQuery in a component, a port in a route store."
		} }
	} } } }
}
```

`src/lib/preferences` still may not call `matchMedia`, and `media-query.ts` may not
touch storage; add a second override for each if you want that exact.

**No global stores under routes.**

```jsonc
{
	"includes": ["src/routes/**"],
	"linter": { "rules": { "style": { "noRestrictedImports": {
		"level": "error",
		"options": { "paths": {
			"zustand": {
				"importNames": ["create"],
				"message": "A route store is built with createStore from zustand/vanilla inside createXStore(deps) and provided with ~/lib/route-store. Only stores that outlive every screen use create, and they live in src/lib."
			}
		} }
	} } } }
}
```

**Route stores and slices take ports.**

```jsonc
{
	"includes": ["src/routes/**/*.store.ts", "src/routes/**/*.slice.ts"],
	"linter": { "rules": { "style": { "noRestrictedImports": {
		"level": "error",
		"options": { "patterns": [ {
			"group": ["@tanstack/react-query", "~/services", "~/lib/query/**", "~/lib/ui/media-query", "~/lib/**/*.store"],
			"message": "A route store or slice receives what it needs as a port in deps; the route module builds it."
		} ] }
	} } } }
}
```

**A settings store is private.**

```jsonc
{
	"includes": ["src/**", "!src/lib/preferences/**"],
	"linter": { "rules": { "style": { "noRestrictedImports": {
		"level": "error",
		"options": { "patterns": [ {
			"group": ["~/lib/preferences/*.store"],
			"message": "Import hooks and ports from ~/lib/preferences/settings."
		} ] }
	} } } }
}
```

Check the option names against the Biome version you install; they have changed
between major versions. An override replaces a rule's options instead of merging
them, so when two overrides configure `noRestrictedImports` for the same file,
repeat the entries that should still apply.

## What a test enforces

Lint can't see everything. A small architecture test that reads source files with
the TypeScript compiler API covers the rest:

- `window.localStorage`, `globalThis.matchMedia` and similar member access to the
  restricted globals, which a globals rule misses;
- a `*.store.ts` or `*.slice.ts` that names a DOM element or React ref type
  (`HTMLElement`, `Element`, `Node`, `RefObject`, …);
- type-only imports of the modules a route store may not import, if your lint rule
  allows `import type`.

Keep three habits with it:

- **A failing fixture per rule.** A file that breaks each rule, and a test that it
  fails with the expected message. Otherwise a check can stop working unnoticed.
- **Exceptions are a list with reasons**, in the test's own module, and adding one
  is a design decision.
- **An exception that no longer violates its rule fails the test**, so the list
  can't outlive the code it excuses.

These checks are syntactic. They don't see a DOM type that is inferred or reached
through an alias. Review covers that.

## Reviewing a store change

1. Which row of the ownership table is this state? If none fits, stop and decide.
2. Does anything in state repeat what Query, the URL, a form, a setting or the
   environment already holds? If it mirrors an outside value, is a change in that
   value a transition for this store?
3. Is the store keyed by its subject, with no subject id in state and no reset
   action?
4. Does every new piece of route store state pass the test: two capabilities read
   it, or another capability's action changes it?
5. Does each slice own one key, import nothing that reaches out, and reach other
   capabilities only through deps?
6. Is every dep a port named for the need, with no Query client, service, store or
   adapter passed whole?
7. Are the rules pure functions beside the slice, and is the store file only
   composition?
8. For a write: who observes it? Does its shape match, and does only the awaited
   reply change what shows?
9. Is anything persisted outside `persist` over the storage adapter, or a setting
   reached through its store object?
10. Does any DOM node or ref type appear in a store or slice?
11. Do the tests build their own store from plain functions and assert state and
    port calls, not hook internals?
12. Does the change add a second way to do something these pages already cover?

## Alternatives these rules replace

Each of these is a reasonable first idea. Keep the reasons, so the idea isn't
tried again without new evidence.

| Alternative | Why not |
| --- | --- |
| One global store per screen, with `reset()` on leaving | The store has to simulate its own lifetime: every new piece of state must be added to the reset, every request needs a guard against replies from the last visit, and tests reset shared state by hand. |
| A route store that spans subjects (one store for every project visited) | State needs a subject id on every piece and a "settle" action per capability to end what the last subject left open. Anything added without the id leaks between subjects. |
| Swapping the store under a mounted tree when the subject changes | Component state under it (a popover, a form draft, scroll) still belongs to the last subject. `key` resets both at once. |
| A store per capability | Capabilities then need each other's stores, or a hook that coordinates them, and one screen has several lifetimes to key. |
| Slices merged into one flat state object | Key collisions are silent, state doesn't say who owns it, and every slice can read and write every other. |
| Importing app stores, services and the Query client into route stores | The store can't be built in a test without the real ones, and it is tied to their shape. When a setting moves to the server, every importing slice changes. |
| Passing whole objects as deps (a Query client, a service, another store's API) | Better than importing, but still hands over everything the object can do, and narrowing a store's API to `getState` still exposes every action. |
| Copying a setting into route state and writing it back | The copy is stale as soon as anything else changes the setting, and two places answer the same question. |
| Passing only a setter into the store | The store can write the value but not read it, so "is it open?" is decided in two places. |
| Coordinating two stores from a hook | The workflow's decision ends up in a hook, where it can't be tested as a transition and a second caller has to repeat it. |
| A hand-written `localStorage` module beside `persist` | A second persistence path: two mechanisms, two failure modes, and values that can disagree. |
| Passing environment values (a breakpoint) into every action | Every caller has to know the value, and two callers can disagree. |
| DOM nodes or refs in the store | Unserializable, visible to devtools, and written from outside actions. They need an exception in every rule. |
| The mutation cache for every write | A screen workflow then keeps its dialog state in the store and its request state in the cache, and a hook has to keep the two in step. Right for writes with one observer. |
| Hand-rolling context, provider and hooks in each store file | Every store repeats the same code, and each copy gets the mount effect or the missing-provider error slightly different. |
