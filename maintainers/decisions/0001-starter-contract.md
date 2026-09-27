# 0001: A self-contained, agent-ready Framework SPA

Accepted 2026-09-26.

- Stack: React Router v8 Framework Mode (`ssr: false`), React Aria-backed shadcn Nova,
  Tailwind, TanStack Query/Form/Table/Pacer, Zod, and small UI utilities.
- Route verticals plus a shared `src/lib/ui`. No monorepo until a CLI or library needs
  its own package. No backend or product-specific API.
- The full supported Aria catalog, as a reviewed inventory, plus removable
  `/examples/*` routes with synthetic fixtures. Removing examples keeps the UI and
  providers.
- Packages, copied UI source, and agent guidance are maintained separately. UI source
  and the Router skill keep provenance records, since the lockfile doesn't cover them.
- Filebonsai's contract, status, decision, and backlog mechanics are adopted. Its
  product rules, permissions, queues, locks, and worktrees aren't. A missing task ID
  isn't proof of completion.
- Starter tracking (status, backlog, decisions, audit, maintenance, `template-*`
  skills) stays in `maintainers/` and `.agents/skills/template-*` and isn't copied
  into apps.
- Distribution: make this folder reproducible, then use a versioned repository
  template or create-react-router custom template, and build a scaffolder only if it's
  needed. `create-react-spa` is a suggested name, not reserved. Nothing is published.
