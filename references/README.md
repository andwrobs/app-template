# Template references

- [App reference ZIP](app-reference.zip) — Data Mode and Framework Mode routing,
  Query data, route stores, commands, session handling, and tests.
  [Browse the source and docs](app-reference/README.md).
- [State reference](state-reference/docs/state/README.md) — the earlier state-focused
  reference, retained separately.
- [Widget builder pattern](widget-builder-pattern/README.md) — widget and dashboard
  design and implementation guidance.

The starter in `../starter` uses Framework Mode. For routing
patterns from the app reference, use its
[Framework guide](app-reference/docs/framework-routing.md) and `framework/`
example. The top-level `app-reference/src/` demonstrates Data Mode and should not
replace the starter's router bootstrap. App-reference Query ownership and naming
policies describe that example; the starter's own documented conventions still
apply to its code.

After editing the unpacked app reference, follow its check and archive commands
to refresh `app-reference.zip`. Dependencies and generated build artifacts belong
outside the ZIP.
