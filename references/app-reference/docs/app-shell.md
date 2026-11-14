# App shell

What wraps every page, where shared code lives, how a capability is put together,
and the app-wide patterns a screen plugs into.

Part of the [app reference](README.md).

## Composition roots

In the Data Mode app under `src/`, four things are built once, each in one place.
Everything else imports the result and never builds its own.

| What | Where | Rule |
| --- | --- | --- |
| Query client and router | `src/app.tsx` | Created once and passed down; nothing imports a shared instance |
| Providers | `src/lib/app/app-providers.tsx`, rendered by `src/app.tsx` | A new app-wide provider goes here and nowhere else |
| Services | `src/services.ts` | Only this file and tests import a service factory |
| Build-time settings | `src/lib/app/env.ts` | Nothing else reads `import.meta.env`, except `import.meta.env.DEV` |

Framework Mode uses `root.tsx` under `appDirectory` for the root document,
providers and outlet. The framework creates the router from `routes.ts`; do not
add `createBrowserRouter` or another `RouterProvider`. `routes.ts`
alone composes the configuration, while `.route.ts` modules supply runtime
exports. Runtime code never imports `@react-router/dev/routes`.

When using Query with `clientLoader`, the provider and client loaders share one
browser QueryClient through a browser-only module. This is the one place the
reference imports a shared client instead of injecting it, because native route
exports have nowhere to receive dependencies. Server rendering requires
request-scoped clients and an explicit hydration path; a server-wide singleton
would share cache entries across requests. The [Framework Mode example](../framework/README.md)
shows the browser pattern; see [Framework Mode routing](framework-routing.md).

```tsx
// src/lib/app/app-providers.tsx
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/** Every app-wide provider, in one place. */
export function AppProviders({
	queryClient,
	children,
}: {
	queryClient: QueryClient;
	children: ReactNode;
}) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

```ts
// src/lib/app/env.ts
import { z } from "zod";

const schema = z.object({
	VITE_APP_NAME: z.string().default("App"),
	VITE_SUPPORT_URL: z.url().optional(),
});

/**
 * Build-time settings, checked once when the app starts. Nothing else reads
 * `import.meta.env`, except for `import.meta.env.DEV`.
 */
export const env = schema.parse(import.meta.env);
```

Parsing settings at startup turns a missing or malformed value into one clear
error on load, instead of an `undefined` that surfaces somewhere unrelated.

The root renders the providers, the document, `<RouteFocus />`,
`<ScrollRestoration />` and the outlet. The shell layout renders what stays
through every signed-in page: navigation, the progress indicator, and the single
instances of app-wide UI (the notices, the confirm dialog).

## Where code lives

```text
src/
  app.tsx                 # composition root: Query client, router, providers
  routes.ts               # every route
  services.ts             # every service instance
  lib/                    # shared by more than one route, or app-wide
    app/                  # wraps every route: providers, env, errors, focus, progress
    api/                  # the API client and its error type
    query/                # the Query client
    session/              # who is signed in; leaving for sign-in
    preferences/          # settings and the storage adapter
    route-store/          # the kit for route stores
    focus/                # focus scopes
    ui/                   # design system: components with no app knowledge
    <domain>/             # tasks/, projects/: service, query options, shared hooks
  routes/
    <route>/              # one folder per route, never nested to mirror URLs
      <route>.route.ts    # defineRoute (Data Mode) or native exports (Framework Mode)
      <route>.page.tsx    # page UI
      <route>.store.ts    # only when capabilities share state
      <route>.search.ts   # only when the route has search params
      lib/                # everything else the route owns
        <capability>/     # one capability's files, together
```

- **Organize by owner, then capability.** A capability's view, hook, slice,
  transitions and tests sit in one folder under the route's `lib/`. There are no `components/`, `hooks/`,
  `utils/` or `types/` folders anywhere.
- **Code starts in its route and moves to `src/lib` when a second route needs it**
  or it takes an app-wide job. Not before.
- **Imports point one way.** Routes import `lib`. `lib` never imports a route.
  Routes never import each other. `lib/ui` imports nothing from the app: no
  router, no Query, no stores. Lint enforces all four.
- **Suffixes carry meaning**: `.route`, `.page`, `.store`, `.slice`, `.queries`, `.service`,
  `.search`, `.test`. File names are kebab-case ([conventions](conventions.md)). In code, components are PascalCase, hooks are `useX`, everything else
  is kebab-case.

## A capability: view, hook, connected component

A capability that renders has three parts.

**The view** renders what it is given and reports what the user did. It imports no
store, query or router hook, so it can be rendered with plain props.

```tsx
// src/routes/project/lib/details/details-toggle-view.tsx
import type { Ref } from "react";

/** A view: renders what it is given and says what the user did. No hooks into the app. */
export function DetailsToggleView({
	open,
	onToggle,
	ref,
}: {
	open: boolean;
	onToggle(trigger: HTMLElement): void;
	ref: Ref<HTMLButtonElement>;
}) {
	return (
		<button
			aria-pressed={open}
			onClick={(event) => onToggle(event.currentTarget)}
			ref={ref}
			type="button"
		>
			Details
		</button>
	);
}
```

**The feature hook** joins the owners (the store, Query, settings, the URL) and
returns what the view renders and the intents it can raise. Sequences, retries,
invalidation and focus live here or below, never in JSX handlers.

```ts
// src/routes/project/lib/details/use-details.ts
import { useEffect } from "react";
import { useDetailsOpen } from "~/lib/preferences/settings";
import { ProjectFocus, useProjectActions, useProjectStore } from "../../project.store";

/** What the details panel shows and how to open or close it. */
export function useDetails() {
	const { docked, drawerOpen } = useProjectStore((project) => project.details);
	// Read through: the setting's owner renders it; the store holds no copy.
	const dockedOpen = useDetailsOpen();
	const { details } = useProjectActions();
	const focus = ProjectFocus.useFocusScope();
	return {
		docked,
		open: docked ? dockedOpen : drawerOpen,
		/** Whatever was pressed is where focus comes back to. */
		toggle(trigger: HTMLElement) {
			focus.remember("detailsOpener", trigger);
			details.toggle();
		},
		close: details.close,
	};
}

/** Run once on the page: after a close commits, focus returns to what opened the panel. */
export function useDetailsFocusReturn() {
	const returning = useProjectStore(
		(project) => project.details.focusRequest === "return",
	);
	const { details } = useProjectActions();
	const focus = ProjectFocus.useFocusScope();
	useEffect(() => {
		if (!returning || details.claimFocus() !== "return") return;
		focus.restore("detailsOpener", "detailsToggle");
		focus.forget("detailsOpener");
	}, [details, focus, returning]);
}
```

**The connected component** binds one to the other and is what the page renders.

```tsx
// src/routes/project/lib/details/details-toggle.tsx
import { ProjectFocus } from "../../project.store";
import { DetailsToggleView } from "./details-toggle-view";
import { useDetails } from "./use-details";

/** The connected component: the one place the hook meets the view. */
export function DetailsToggle() {
	const details = useDetails();
	const focus = ProjectFocus.useFocusScope();
	return (
		<DetailsToggleView
			onToggle={details.toggle}
			open={details.open}
			ref={focus.ref("detailsToggle")}
		/>
	);
}
```

The page composes connected components: `<DetailsToggle />`, `<TaskList />`,
`<ArchiveDialog />`. It passes ids, not data, and holds no workflow of its own.

Keep this proportional. A static component needs no hook. A capability with one
small component can keep its hook call in the component. The rule is about where
decisions live: if a handler in JSX is deciding what happens next, that decision
has no owner yet.

Name intents for what the user means (`archive`, `discardDraft`, `retry`), not for
the state they set (`setOpen`, `setStatus`). A consumer that has to call two
setters in the right order is doing the owner's job.

## Telling the user something

| What happened | Where it shows |
| --- | --- |
| The result of something the user just did on this screen | Beside it: inline in the form, in the dialog, or in the screen's status line. It belongs to the capability's state. |
| Background work finished while they were looking elsewhere | A notice, from the app-lifetime notice store |
| The page couldn't load | The route's error boundary |

```ts
// src/lib/notices/notice.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Notice = { id: string; text: string };

export type NoticeState = { notices: readonly Notice[] };

export type NoticeActions = {
	actions: {
		/** Says something about work that finished away from where the user is looking. */
		notify(text: string): void;
		dismiss(id: string): void;
	};
};

export const initialState: NoticeState = { notices: [] };

const most = 3;

export const useNoticeStore = create<NoticeState & NoticeActions>()(
	devtools(
		(set) => ({
			...initialState,
			actions: {
				notify: (text) =>
					set(
						({ notices }) => ({
							notices: [...notices, { id: crypto.randomUUID(), text }].slice(-most),
						}),
						false,
						"notify",
					),
				dismiss: (id) =>
					set(
						({ notices }) => ({ notices: notices.filter((notice) => notice.id !== id) }),
						false,
						"dismiss",
					),
			},
		}),
		{ name: "app:notices", enabled: import.meta.env.DEV },
	),
);

export const useNotices = () => useNoticeStore((state) => state.notices);
export const useNoticeActions = () => useNoticeStore((state) => state.actions);
```

One component in the shell renders the notices in a live region
(`role="status"`). A screen that leaves while its own work is in flight doesn't
turn its result into a notice; that work ends with the screen
([commands](state/commands.md)).

## Dialogs

- **A dialog is state, not a function call.** Whether it is open is a boolean (or
  the thing it is about) owned by its capability. The exception is the confirm
  question below.
- **A dialog that is a place lives in the URL.** A preview someone could link to,
  or that Back should close, is a search param.
- **One modal at a time.** When one opens over another surface, the first gives
  way in the same action.
- **Focus returns to what opened it.** The dialog component does this by itself.
  When the opener is gone, use a [focus scope](state/environment-and-focus.md).

## Asking before acting

Work sometimes has to stop and ask: "Replace the existing file?", "Discard 3
changes?". The question is state, and the answer is a promise the asking code
awaits.

```ts
// src/lib/confirm/confirm.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Question = { title: string; body: string; confirmLabel: string };

export type ConfirmState = { question: Question | null };

export type ConfirmActions = {
	actions: {
		/** Asks the user and waits. Resolves to their answer; a newer question answers this one "no". */
		ask(question: Question): Promise<boolean>;
		answer(yes: boolean): void;
	};
};

export const initialState: ConfirmState = { question: null };

/**
 * A question that work is waiting on. State holds what to show; the promise's
 * resolver stays private to the store. One dialog in the shell renders
 * `question` and calls `answer`.
 */
export const useConfirmStore = create<ConfirmState & ConfirmActions>()(
	devtools(
		(set) => {
			let resolve: ((yes: boolean) => void) | null = null;
			const settle = (yes: boolean) => {
				resolve?.(yes);
				resolve = null;
			};
			return {
				...initialState,
				actions: {
					ask(question) {
						settle(false);
						set({ question }, false, "ask");
						return new Promise<boolean>((resolver) => {
							resolve = resolver;
						});
					},
					answer(yes) {
						settle(yes);
						set({ question: null }, false, "answer");
					},
				},
			};
		},
		{ name: "app:confirm", enabled: import.meta.env.DEV },
	),
);

export const useQuestion = () => useConfirmStore((state) => state.question);
export const useConfirmActions = () => useConfirmStore((state) => state.actions);
/** A port for route stores: `confirm: askToConfirm`. */
export const askToConfirm = (question: Question) =>
	useConfirmStore.getState().actions.ask(question);
```

One dialog in the shell renders `question` and calls `answer`. The resolver stays
private to the store. A route store asks through a port (`confirm: askToConfirm`),
so its tests answer with `() => Promise.resolve(true)`.

## A screen contributing to the shell

The shell sometimes shows what the current screen offers: commands in a palette,
actions in a header, a breadcrumb. The shell must not import the screen, so the
screen registers what it offers while it is mounted.

```ts
// src/lib/command-palette/page-commands.store.ts
import { useEffect } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type PageCommand = { id: string; label: string; run(): void };

export type PageCommandsState = { commands: readonly PageCommand[] };

export type PageCommandsActions = {
	actions: {
		/** Offers these commands while the caller is on screen; returns the function that withdraws them. */
		register(commands: readonly PageCommand[]): () => void;
	};
};

export const initialState: PageCommandsState = { commands: [] };

export const usePageCommandsStore = create<PageCommandsState & PageCommandsActions>()(
	devtools(
		(set) => ({
			...initialState,
			actions: {
				register(commands) {
					set((state) => ({ commands: [...state.commands, ...commands] }), false, "register");
					return () =>
						set(
							(state) => ({
								commands: state.commands.filter((command) => !commands.includes(command)),
							}),
							false,
							"withdraw",
						);
				},
			},
		}),
		{ name: "app:page-commands", enabled: import.meta.env.DEV },
	),
);

/**
 * How a screen contributes to the shell: it registers while mounted and the
 * effect's cleanup withdraws. The shell never imports the screen. Pass a
 * stable array.
 */
export function usePageCommands(commands: readonly PageCommand[]) {
	const register = usePageCommandsStore((state) => state.actions.register);
	useEffect(() => register(commands), [register, commands]);
}
```

This is the only way a route puts something into an app-lifetime store: an effect
that registers, whose cleanup withdraws. The store never learns which screen it
was.

## Small rules

- **One owner per timer.** Debounce and throttle with a pacing library
  (`@tanstack/pacer`), never raw `setTimeout`. In a store, the debouncer is a
  constant in the creator. Cancel pending work when its owner goes away, and never
  let an older result overwrite a newer one.
- **Claim one-shot requests.** When state asks for something to happen once (move
  focus, scroll to a row), the hook that carries it out calls an action that
  returns the request and clears it. Reading and clearing in one step means two
  renders can't both act on it.
- **Format in one module.** Dates, sizes, counts and plurals go through
  `src/lib/format` over `Intl`. Components never build these strings.
- **Report in one module.** Unexpected errors go through one function that redacts
  before it logs. Never log tokens, signed URLs, credentials or request bodies.
- **Let the compiler memoize.** Enable the React Compiler and stop writing
  `useMemo`, `useCallback` and `memo` by hand. Hand memoization is noise that gets
  copied inconsistently, and a missed dependency is a bug the compiler doesn't
  make. Follow the compiler's install guide for your bundler.
- **Keyboard and labels are not optional.** Every control has an accessible name,
  every flow works without a pointer, every page has one `<h1>`, and motion
  respects `prefers-reduced-motion`.
