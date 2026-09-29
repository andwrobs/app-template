# React Router SPA starter

React Router 8 (Framework Mode, SPA) with React Aria-backed shadcn Nova, Tailwind 4,
TanStack Query/Form/Table/Pacer, Zod, Zustand, Geist, and Lucide. Agents start at
[AGENTS.md](AGENTS.md).

```bash
nvm use        # Node 24; minimum 22.22.0
npm ci
npm run dev    # http://localhost:3000
npm test       # lint, typecheck, tests, build
```

Settings live in `VITE_` variables: copy `.env.example` to `.env.local` to change
them. `src/lib/env` validates them, so a bad value stops `dev` and `build`.

`npm run build` writes static files to `build/client`; there's no Node server.
`npm run preview` serves them on port 4000. Hosts must serve `index.html` for app
routes and serve assets and API paths normally.

Included:

- SPA routing with a root fallback, an error boundary, and a shared Query cache.
- The shadcn Aria Nova catalog in `src/lib/ui`, light and dark themes, and reduced
  motion.
- A TanStack Form binding (`src/lib/form`) and URL-backed search (`src/lib/url-state`).
- Services built once in `src/services.ts`, with lint rules that keep them free of
  React and app state.
- GitHub CI and Dependabot, active once this folder is a repository root.

Refresh or add components with `npm run ui:add -- <name>`. The pinned shadcn CLI
writes them into `src/lib/ui`. Review the code and any new dependencies, because
registry content isn't pinned.

Docs: [code organization](docs/code-organization.md),
[data and forms](docs/data-and-forms.md), [testing](docs/testing.md).

## Examples

Removable routes in `src/routes/examples`: Query + Router, Form, Table, Pacer, and
every component. See [data and forms](docs/data-and-forms.md#examples) for what each
shows and [code organization](docs/code-organization.md#examples) for removing them.

## Create an app from this starter

From this folder, with dependencies installed:

```bash
node bin/create-react-spa.mjs ../my-app
```

It copies the app files, renames the package, records the template version and
commit in package.json, runs `npm ci`, and leaves out `maintainers/`, `bin/`, and the
`template-*` skills. `--no-examples` removes the example routes; `--help` lists the
other options. Then run `npm test` in the new app.
