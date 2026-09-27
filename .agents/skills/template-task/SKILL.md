---
name: template-task
description: Change this starter itself (source, docs, or agent workflow) or pick up one of its backlog items, and record the result in maintainers/status.md. Use for any non-trivial change to the starter repository, not for apps created from it or simple questions.
---

# Starter task

Read `maintainers/README.md` and `maintainers/status.md`, plus the backlog item and the
docs it names if there is one. Root `AGENTS.md` still governs the work itself.

1. Check the source and lockfile instead of assuming. A dependency is done only if
   status says so. Split L items. If another branch or worktree owns the work,
   inspect it instead of duplicating it.
2. Mark the work active in status and build one coherent slice. Only one writer at a
   time for dependency, route, and global UI files.
3. Diagnose repeated failures instead of weakening tests. Decision and spike items
   end in a sourced recommendation that lists open choices, not in implementation.
4. Before finishing, run `npm test` and the "Keep apps clean" check.
5. Update status with commands, results, limitations, and the next action. When an
   item's acceptance is fully met, delete it and its index row and log it under
   Completed. A partial item stays with what's left. Whenever an item is finished,
   split, dropped, or merged, update its dependents.
6. If interrupted or near a usage limit, write the active paths, commands and results,
   failures, and the exact next command to status so another agent can resume without
   the transcript. Don't mark it done.

For a requested PR, give the outcome, evidence, and remaining risk briefly, without
another repository's PR template.
