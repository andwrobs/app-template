# Framework Mode variant

This is a React Router 8.4 SPA using Framework Mode (`ssr: false`). The sibling
`../src` example uses Data Mode and its custom `defineRoute` helper. This variant
keeps the same services, TanStack Query cache policy, route stores, and screen UI,
but uses native Framework route modules and generated route types.

Install from the archive root so the shared source and this npm workspace resolve
the same dependencies:

```sh
npm install
npm run dev --workspace app-reference-framework
npm run typecheck --workspace app-reference-framework
npm run test --workspace app-reference-framework
npm run build --workspace app-reference-framework
npm run preview --workspace app-reference-framework
```

Use Node 24 LTS or a supported version of Node for Vite 8. No backend or API mock
ships with this example. Its real services expect these same-origin endpoints:

- `GET /api/session`: `{ "viewerId": "v1", "name": "Ada" }`, or HTTP 401.
- `POST /api/session`: accepts `{ "email": "...", "password": "..." }` and signs in.
- `DELETE /api/session`: signs out.
- `GET /api/projects/:projectId/tasks?order=name|due`: an array of
  `{ "id": "t1", "name": "Write the brief", "starred": false }`.

Open `/sign-in` or `/projects/p1`. Configure a dev proxy in `vite.config.ts` or
serve the API on the same origin. For static hosting, serve `build/client` and
rewrite application paths to `index.html`; keep `/api` routed to your backend.
This reference has no home/dashboard route, so `/` reaches the not-found screen.

## The files

`src/routes.ts` is the only place routes are registered. It holds every URL and
module file, and assembles the tree:

```ts
export default [
  route("sign-in", "routes/sign-in/sign-in.route.ts"),
  layout("routes/app-shell/app-shell.route.ts", [
    route("projects/:projectId", "routes/project/project.route.ts"),
  ]),
  route("*", "routes/not-found/not-found.route.ts"),
] satisfies RouteConfig;
```

Module paths are relative to `appDirectory`, configured as `framework/src`. React
Router evaluates this configuration for type generation, which is where
`projectId` typing comes from.

`project.route.ts` exports native route APIs: `default` and `clientLoader` here.
Its default component uses an explicit import followed by `export default
ProjectPage`; the re-export shorthand `export { ProjectPage as default } from …`
is not given route props. React Router owns route code splitting.
The loader warms the same QueryClient that `src/root.tsx` gives `AppProviders`.

`project.page.tsx` gets its types from the **registered route module**:

```tsx
import type { Route } from "./+types/project.route";
import { ProjectView } from "./project-view.client";

export function ProjectPage({ params }: Route.ComponentProps) {
  return <ProjectView params={params} />;
}
```

`params.projectId` is inferred as `string`. There is no manually repeated route
parameter interface, generic cast, or runtime import of generated types. If a
route returns data, its generated `loaderData` type is available on the same
`Route.ComponentProps`. This route returns `null` because the shared screen reads
server data with `useSuspenseQuery`.

The generated files live in `.react-router/types`. `react-router dev` generates
them automatically; `npm run typecheck` runs `react-router typegen` before `tsc`.
Do not commit or hand-edit generated route types.

## Shared source and browser boundaries

The `~` alias points at the sibling `../src` in both TypeScript and Vite. Local
Framework modules use relative imports. The original Data Mode router and its
`defineRoute` helper are never imported into this app.

`project-view.client.ts` reuses the original screen as `ProjectView`, which accepts
ordinary props. Its preferences store registers browser listeners at import time.
The `.client` boundary keeps that browser-only module out of build-time rendering.
The Framework `ProjectPage` remains the small adapter with the generated route
contract. A standalone Framework app can instead keep server-safe UI directly in
`project.page.tsx` and still use the same generated types.

`query-client.client.ts` owns one QueryClient for this browser page load. It is
a module-level instance because native route exports can't receive injected
dependencies; tests clear it between cases. Native
`clientMiddleware` in the app-shell module checks the session before invoking
child loaders. A 401 triggers a document redirect to sign-in with `returnTo`;
other failures reach the root boundary. This guard controls client navigation;
the API must enforce authorization too.

Even with `ssr: false`, React Router prerenders the root document and
`HydrateFallback` during the build. They do not access the browser or the Query
client. The root provider mounts once the initial client handlers complete. This
variant is intentionally a browser SPA: enabling server rendering would require
request-scoped Query clients, a data hydration strategy, and server-safe views.

## Validation

Type generation and TypeScript check the inferred route contract. The production
build checks the route-module integration, `.client` boundaries, and root
prerendering. The handler tests use the real services and QueryClient with fetch
stubbed at the network boundary: they verify guard ordering, shared cache reuse,
the expired-session redirect, and propagation of page failures. They do not
replace a browser integration check of Framework's component-prop injection.

See [route type generation](https://reactrouter.com/explanation/type-safety),
[route modules](https://reactrouter.com/start/framework/route-module), and
[SPA mode](https://reactrouter.com/how-to/spa).
