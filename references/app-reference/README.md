# App reference

React Router, TanStack Query/Form, and Zustand patterns, with two routing modes
for the same project screen. Start with the [documentation](docs/README.md).

| Location | Purpose |
| --- | --- |
| `src/`, `test-utils/` | Data Mode source and tests: `defineRoute`, dependency injection, lazy pages |
| [framework/](framework/README.md) | Framework Mode SPA: `routes.ts`, native route modules, generated page props |
| [docs/routing.md](docs/routing.md) | Data Mode conventions |
| [docs/framework-routing.md](docs/framework-routing.md) | Framework Mode conventions and the mode comparison |

The Data Mode example is reference source tested through a memory router. The
Framework example includes the Vite build and document entry point. Both use the
same services, Query options, and client-state features. Neither includes an API
server; see the [Framework setup](framework/README.md) for the required endpoints.

## Check the examples

Use Node 24 (minimum 22.22.0), npm, and Python 3. Install at this archive's root;
npm workspaces also install the Framework tooling here so both examples resolve
the same dependencies.

```sh
npm install
npm run check
npm run dev --workspace app-reference-framework
```

`check` verifies source snippets, typechecks and tests the Data Mode example,
then generates Framework route types, typechecks, and builds the SPA. The
[testing guide](docs/testing.md) describes what each check establishes.

## Keep the ZIP current

Edit the source files first, then synchronize the matching documentation blocks:

```sh
npm run docs:sync
npm run check
npm run archive
```

`archive` writes `../app-reference.zip`, which is gitignored, with the same root
layout as this directory. It checks source snippets and excludes dependencies,
generated types, build output, caches, symlinks, and operating-system metadata.
Extract it into an empty directory.
