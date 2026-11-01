# 0002: Distribution, license, and releases

Accepted 2026-09-27. The owner delegated these choices; each can change.

- **Repository:** this folder is its own Git repository, so `.github/` sits at its
  root and CI and Dependabot run. Suggested remote: a private GitHub repository,
  `andwrobs/react-router-spa-template`. Creating or pushing it needs the owner.
- **Visibility:** private. Going public later is easy; the reverse isn't.
- **License:** MIT (`LICENSE`), matching the shadcn and React Router sources it
  copies. Apps don't receive it; they choose their own.
- **Releases:** SemVer tags `vX.Y.Z`. `package.json` `version` matches the latest tag,
  and [the changelog](../CHANGELOG.md) lists each release. Pre-1.0 until QUALITY-01
  puts browser checks in CI.
- **Creating apps:** `bin/create-react-spa.mjs`, a dependency-free local CLI. It copies
  an allowlist, renames the package and lockfile, records the template name, version,
  and commit in the app's `package.json` `template` field, and can drop the examples.
  Apps take template changes by reading the changelog and diffing tags, then porting
  what they want; nothing updates them automatically.

## Alternatives

- `create-react-router --template` (8.4.0, `dist/cli.js`) copies everything except
  `.git` and `node_modules`, so `maintainers/`, `bin/`, and the `template-*` skills
  would reach apps. By default it also installs the upstream all-modes agent skill and
  makes a Git commit.
- A GitHub template repository copies every file, with the same leak.
- Publishing the CLI to npm (`npm create react-spa`) adds a package to maintain and
  needs a name check. It stays a local script until there's a reason.
