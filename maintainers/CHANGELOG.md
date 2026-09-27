# Changelog

## Unreleased

- Page titles from `lib/meta`, focus on the new page's heading after navigation, a
  skip link, and styled not-found and error pages.
- `SidebarLayout`, a one-line alternative to the header layout, sharing
  `lib/app/nav.ts`.
- `lib/env` validates `VITE_` settings for `dev` and `build`; apps get `.env.example`.
- `lib/api` (`fetchJson`, `api`, `ApiError`), used by the examples.
- The `new-route` app skill.
- `maintainers/check-upstream.mjs` and a monthly scheduled run.

## 0.1.0, 2026-09-27

First tagged version.

- React Router 8.4.0 Framework SPA with a root fallback, error boundary, shared Query
  cache, and Aria links through the router.
- The shadcn aria-nova catalog (52 components, see the [UI inventory](ui-inventory.md)),
  light and dark themes, and reduced motion.
- `lib/form` (TanStack Form bound to Aria fields), `lib/url-state`, and `lib/theme`.
- Removable examples: Query + Router, Form, Table v9, Pacer, and components.
- `bin/create-react-spa.mjs` creates apps, with or without the examples.
