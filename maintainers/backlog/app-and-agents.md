# App foundations and agent guidance

What apps need on day one, and what agents in apps need to follow the house style.
Read [code organization](../../docs/code-organization.md) and
[data and forms](../../docs/data-and-forms.md).

## APP-01 Page titles

P1 · S · Build. Depends on: none.

**Outcome:** every route sets a document title, with an app-wide default.

**Acceptance:** a default title in root that the SPA build writes into `index.html`,
a `meta` export on every route, and one place that holds the app name.

**Checks:** a test per route for its title, rendered tab titles, baseline.

## APP-02 Styled not-found and error pages

P1 · S · Build. Depends on: none.

**Outcome:** unknown URLs and uncaught errors show Nova-styled pages with a way back.

**Acceptance:** a catch-all route that renders "not found" with a link home, and a root
error boundary that uses `lib/ui`, offers reload and home, and shows details only in
development.

**Checks:** tests for both, a rendered unknown URL and forced error, baseline.

## APP-03 Route change focus

P1 · S · Build. Depends on: none.

**Outcome:** screen-reader and keyboard users learn that the page changed.

**Acceptance:** after a navigation that changes the path, focus moves to the new
page's heading without scrolling. Search-only and hash changes, and the first load,
leave focus alone. A skip link reaches the main content.

**Checks:** tests for path, search-only, and first-load cases; rendered keyboard check;
baseline.

## APP-04 Optional sidebar app shell

P2 · M · Build. Depends on: none.

**Outcome:** dashboard-style apps can swap the header layout for a sidebar layout in
one line.

**Acceptance:** a `lib/app` sidebar layout built on `lib/ui/sidebar`, sharing one nav
list with the header, with the theme toggle, active-link state, collapse on desktop,
and a sheet on mobile. `--no-examples` still removes the example links.

**Checks:** tests for nav and collapse, rendered desktop and mobile, baseline.

## APP-05 Validated environment

P2 · S · Build. Depends on: none.

**Outcome:** a missing or malformed `VITE_*` setting fails `dev` and `build` with a
clear message instead of failing at request time.

**Acceptance:** one Zod schema in `lib/env`, checked in `vite.config.ts` and parsed for
typed runtime access, plus a committed `.env.example` that apps receive.

**Checks:** tests for defaults and bad values, a build that fails on a bad value,
baseline.

## API-02 A small API client

P2 · S · Build. Depends on: APP-05.

**Outcome:** one fetch helper for JSON with Zod parsing, abort signals, and consistent
errors, so routes stop hand-rolling it.

**Acceptance:** `lib/api` with a typed error that tells network, HTTP, and invalid
response apart; aborts pass through for Query; paths resolve against the validated
base URL. The examples use it.

**Checks:** tests for success, each error kind, and abort; the example tests still
pass; baseline.

## AGENT-01 A "new route" skill for apps

P1 · S · Build. Depends on: APP-01.

**Outcome:** an agent in an app adds a feature route in the house style without
rereading every doc.

**Acceptance:** an app skill covering the route folder, `meta`, query options and
`clientLoader`, the component view-plus-hook split, tests beside the code with
`renderRoute`, `routes.ts`, nav, and the checks. Apps receive it; `AGENTS.md` points
to it.

**Checks:** follow it in a generated app to add a route, then `npm test` there.
