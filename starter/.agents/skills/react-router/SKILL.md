---
name: react-router
description: Build and upgrade this React Router v8 Framework Mode SPA. Use for route configuration, clientLoader/clientAction, generated route types, Query integration, navigation, pending states, and route errors. The app does not use Data, Declarative, RSC, or runtime SSR modes.
license: MIT
---

# React Router Framework SPA

Adapted from the app skill in `create-react-router@8.4.0`
([provenance](references/upstream.md)). Read root `AGENTS.md` and the
[Framework SPA guidance](references/framework-mode.md).

Keep the fixed shape unless the user changes it: `appDirectory: "src"`,
`ssr: false`, explicit `src/routes.ts`, and generated `./+types/*`.

For API details, read `node_modules/react-router/docs/` (`start/framework/`,
`how-to/`), or the official site for the installed version. This app's `docs/` don't
replace them.

Use `clientLoader` for route data and `clientAction` for route-owned mutations, and
share Query options and the cache with components (`docs/data-and-forms.md`). Don't
copy server `loader`/`action` or `createBrowserRouter` setups from tutorials.

After route edits, run typegen, typecheck, and the affected tests. After rendering,
provider, or config changes, also build. Check direct-route refresh on a static host
and first hydration, not just client navigation.
